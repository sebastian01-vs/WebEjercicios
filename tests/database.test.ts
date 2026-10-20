import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { emptyPlan, starterPlan } from "@/lib/catalog";

const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const db = new PGlite();

async function becomeUser(id: string) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
  await db.exec("set role authenticated");
}

beforeAll(async () => {
  // Simulate Supabase's auth contract in real embedded PostgreSQL, with non-owner roles.
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
  `);
  const migration = await readFile(
    new URL("../supabase/migrations/202610200001_initial_schema.sql", import.meta.url),
    "utf8",
  );
  await db.exec(migration);
  await db.query(
    "insert into auth.users(id, email, raw_user_meta_data) values ($1, $2, $3), ($4, $5, $6)",
    [USER_A, "alice@example.test", { name: "Alice" }, USER_B, "bob@example.test", { name: "Bob" }],
  );
  await becomeUser(USER_A);
  await db.query("select public.save_weekly_plan($1::jsonb)", [JSON.stringify(starterPlan())]);
  await becomeUser(USER_B);
  await db.query("select public.save_weekly_plan($1::jsonb)", [JSON.stringify(emptyPlan())]);
}, 30000);

afterAll(async () => {
  await db.close();
});

describe("database ownership and atomic persistence", () => {
  it("creates profiles automatically and hides other users' profiles and routines", async () => {
    await becomeUser(USER_A);
    const profiles = await db.query<{ name: string }>("select name from public.users");
    expect(profiles.rows).toEqual([{ name: "Alice" }]);
    const routines = await db.query<{ user_id: string }>(
      "select user_id from public.weekly_routines",
    );
    expect(routines.rows).toHaveLength(7);
    expect(routines.rows.every((row) => row.user_id === USER_A)).toBe(true);
    const exercises = await db.query("select id from public.routine_exercises");
    expect(exercises.rows.length).toBeGreaterThan(0);
  });

  it("prevents cross-user inserts and modifications, including exercise ownership", async () => {
    await db.exec("reset role");
    const routines = await db.query<{ id: string }>(
      "select id from public.weekly_routines where user_id=$1 and day_of_week=1",
      [USER_A],
    );
    const routineId = routines.rows[0].id;
    await becomeUser(USER_B);
    expect((await db.query("select id from public.routine_exercises")).rows).toHaveLength(0);
    await expect(
      db.query(
        "insert into public.weekly_routines(user_id, day_of_week, muscle_focus) values ($1, 1, 'Intrusion')",
        [USER_A],
      ),
    ).rejects.toThrow(/row-level security/i);
    await expect(
      db.query(
        "insert into public.routine_exercises(routine_id, exercise_id, exercise_name, body_part, equipment, sets, reps, order_index) values ($1, 'x', 'Intrusion', 'chest', 'barbell', 3, '10', 29)",
        [routineId],
      ),
    ).rejects.toThrow(/row-level security/i);
    const update = await db.query(
      "update public.weekly_routines set muscle_focus='Intrusion' where id=$1 returning id",
      [routineId],
    );
    expect(update.rows).toHaveLength(0);
    await expect(
      db.query("update public.users set email='changed@example.test' where id=$1", [USER_B]),
    ).rejects.toThrow(/permission denied/i);
  });

  it("rolls back the entire week if the last day fails a constraint", async () => {
    await becomeUser(USER_A);
    const invalid = starterPlan();
    invalid[0].muscle_focus = "SHOULD ROLL BACK";
    invalid[6].exercises = [
      { ...invalid[0].exercises[0], id: crypto.randomUUID(), sets: 0, order_index: 0 },
    ];
    await expect(
      db.query("select public.save_weekly_plan($1::jsonb)", [JSON.stringify(invalid)]),
    ).rejects.toThrow(/check constraint/i);
    const result = await db.query<{ muscle_focus: string }>(
      "select muscle_focus from public.weekly_routines where day_of_week=1",
    );
    expect(result.rows[0].muscle_focus).toBe("Pecho y tríceps");
    expect((await db.query("select id from public.routine_exercises")).rows).toHaveLength(18);
  });

  it("rejects duplicate days at the database boundary", async () => {
    await becomeUser(USER_A);
    const invalid = emptyPlan();
    invalid[6].day_of_week = 1;
    await expect(
      db.query("select public.save_weekly_plan($1::jsonb)", [JSON.stringify(invalid)]),
    ).rejects.toThrow(/exactly once/i);
  });

  it("denies anonymous table access and execution of the save function", async () => {
    await db.exec("reset role; set role anon");
    await expect(db.query("select * from public.weekly_routines")).rejects.toThrow(
      /permission denied/i,
    );
    await expect(
      db.query("select public.save_weekly_plan($1::jsonb)", [JSON.stringify(emptyPlan())]),
    ).rejects.toThrow(/permission denied/i);
    await db.exec("reset role");
  });
});
