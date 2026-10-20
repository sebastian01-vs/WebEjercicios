-- Execute once in Supabase SQL Editor or with `supabase db push`.
-- PostgreSQL 15+ / Supabase. No service-role key is used by the application.

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now()
);

create table public.weekly_routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 1 and 7), -- ISO: Monday=1
  muscle_focus text not null default 'Descanso' check (char_length(trim(muscle_focus)) between 1 and 60),
  created_at timestamptz not null default now(),
  unique (user_id, day_of_week)
);

create table public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.weekly_routines(id) on delete cascade,
  exercise_id text not null check (char_length(exercise_id) between 1 and 120),
  exercise_name text not null check (char_length(trim(exercise_name)) between 1 and 160),
  body_part text not null check (char_length(body_part) between 1 and 80),
  equipment text not null check (char_length(equipment) between 1 and 80),
  gif_url text not null default '' check (char_length(gif_url) <= 2048 and (gif_url = '' or gif_url like '/exercises/%' or gif_url ~ '^https://')),
  sets smallint not null default 3 check (sets between 1 and 20),
  reps text not null default '10-12' check (reps ~ '^[0-9]{1,3}([[:space:]]*[-–][[:space:]]*[0-9]{1,3})?([[:space:]]*s)?$'),
  order_index smallint not null check (order_index between 0 and 29),
  unique (routine_id, order_index)
);

create index routine_exercises_routine_id_idx on public.routine_exercises(routine_id);

alter table public.users enable row level security;
alter table public.weekly_routines enable row level security;
alter table public.routine_exercises enable row level security;

create policy users_select_own on public.users for select to authenticated using (id = (select auth.uid()));
create policy users_update_own on public.users for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy weekly_select_own on public.weekly_routines for select to authenticated using (user_id = (select auth.uid()));
create policy weekly_insert_own on public.weekly_routines for insert to authenticated with check (user_id = (select auth.uid()));
create policy weekly_update_own on public.weekly_routines for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy weekly_delete_own on public.weekly_routines for delete to authenticated using (user_id = (select auth.uid()));

create policy exercises_select_own on public.routine_exercises for select to authenticated using (
  exists (select 1 from public.weekly_routines r where r.id = routine_id and r.user_id = (select auth.uid()))
);
create policy exercises_insert_own on public.routine_exercises for insert to authenticated with check (
  exists (select 1 from public.weekly_routines r where r.id = routine_id and r.user_id = (select auth.uid()))
);
create policy exercises_update_own on public.routine_exercises for update to authenticated using (
  exists (select 1 from public.weekly_routines r where r.id = routine_id and r.user_id = (select auth.uid()))
) with check (
  exists (select 1 from public.weekly_routines r where r.id = routine_id and r.user_id = (select auth.uid()))
);
create policy exercises_delete_own on public.routine_exercises for delete to authenticated using (
  exists (select 1 from public.weekly_routines r where r.id = routine_id and r.user_id = (select auth.uid()))
);

revoke all on public.users, public.weekly_routines, public.routine_exercises from anon, authenticated;
grant usage on schema public to authenticated;
grant select on public.users to authenticated;
grant update (name) on public.users to authenticated;
grant select, insert, update, delete on public.weekly_routines, public.routine_exercises to authenticated;

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.users (id, email, name)
  values (new.id, coalesce(new.email, ''), left(coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), 'Atleta'), 80));
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create function public.sync_user_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.users set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;
revoke all on function public.sync_user_email() from public, anon, authenticated;
create trigger on_auth_user_email_changed after update of email on auth.users for each row
when (old.email is distinct from new.email) execute function public.sync_user_email();

-- Backfill accounts that were created before applying this migration.
insert into public.users (id, email, name)
select id, coalesce(email, ''), left(coalesce(nullif(trim(raw_user_meta_data->>'name'), ''), 'Atleta'), 80)
from auth.users on conflict (id) do nothing;

-- SECURITY INVOKER keeps RLS active. A failed item rolls the entire week back.
create function public.save_weekly_plan(p_days jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_day jsonb;
  v_exercise jsonb;
  v_routine uuid;
  v_index bigint;
begin
  if v_user is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if jsonb_typeof(p_days) is distinct from 'array' then raise exception 'Expected an array of seven days'; end if;
  if jsonb_array_length(p_days) <> 7 then raise exception 'Expected seven days'; end if;
  if (select count(distinct (value->>'day_of_week')::integer) from jsonb_array_elements(p_days)) <> 7 then
    raise exception 'Each day must appear exactly once';
  end if;

  -- Serialize saves for this user without locking other people's plans.
  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));

  for v_day in select value from jsonb_array_elements(p_days) loop
    if jsonb_typeof(v_day->'exercises') is distinct from 'array' then raise exception 'Exercises must be an array'; end if;
    if jsonb_array_length(v_day->'exercises') > 30 then raise exception 'Too many exercises'; end if;
    insert into public.weekly_routines (user_id, day_of_week, muscle_focus)
    values (v_user, (v_day->>'day_of_week')::smallint, trim(v_day->>'muscle_focus'))
    on conflict (user_id, day_of_week) do update set muscle_focus = excluded.muscle_focus
    returning id into v_routine;

    delete from public.routine_exercises where routine_id = v_routine;
    for v_exercise, v_index in select value, ordinality - 1 from jsonb_array_elements(v_day->'exercises') with ordinality loop
      if (v_exercise->>'order_index')::integer is distinct from v_index::integer then raise exception 'Invalid exercise order'; end if;
      insert into public.routine_exercises (id, routine_id, exercise_id, exercise_name, body_part, equipment, gif_url, sets, reps, order_index)
      values ((v_exercise->>'id')::uuid, v_routine, v_exercise->>'exercise_id', trim(v_exercise->>'exercise_name'),
        v_exercise->>'body_part', v_exercise->>'equipment', coalesce(v_exercise->>'gif_url', ''),
        (v_exercise->>'sets')::smallint, trim(v_exercise->>'reps'), v_index);
    end loop;
  end loop;
end;
$$;
revoke all on function public.save_weekly_plan(jsonb) from public, anon;
grant execute on function public.save_weekly_plan(jsonb) to authenticated;
