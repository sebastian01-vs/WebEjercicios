"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Dumbbell,
  Flame,
  Layers3,
  Moon,
  Pencil,
  Sparkles,
} from "lucide-react";
import { usePlanner } from "./planner-provider";
import { DayCard } from "./day-card";
import { ExerciseImage } from "./exercise-image";
import { WorkoutArt } from "./workout-art";
import { BODY_PARTS, DAYS, EQUIPMENT, labelFor } from "@/lib/types";
import { dayDate, localDateKey, mondayOf, weekLabel } from "@/lib/dates";
import { ExerciseDetail } from "./exercise-detail";
import type { PlannedExercise } from "@/lib/types";

export function Dashboard() {
  const { user, isGuest, plan, ready, completed, toggleCompleted } = usePlanner();
  const [now, setNow] = useState<Date | null>(null);
  const [selected, setSelected] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [detail, setDetail] = useState<PlannedExercise | null>(null);
  useEffect(() => {
    const update = () => {
      const date = new Date();
      setNow(date);
      setSelected((date.getDay() + 6) % 7);
    };
    // Read the visitor's clock after hydration; do not use the server's timezone.
    update();
  }, []);
  const monday = now ? mondayOf(now) : null;
  if (monday) monday.setDate(monday.getDate() + weekOffset * 7);
  const day = plan[selected];
  const dateKey = monday ? localDateKey(dayDate(monday, selected)) : "";
  const done = day.exercises.filter((e) => completed[`${dateKey}:${e.id}`]).length;
  const totalExercises = plan.reduce((sum, d) => sum + d.exercises.length, 0);
  const totalSets = plan.reduce((sum, d) => sum + d.exercises.reduce((s, e) => s + e.sets, 0), 0);
  const trainingDays = plan.filter((d) => d.exercises.length).length;

  return (
    <div className="dashboard">
      <section className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="tiny-line" />
            TU MEJOR VERSIÓN, UN DÍA A LA VEZ
          </div>
          <h1>
            Bienvenido{user ? `, ${user.name.split(" ")[0]}` : ", atleta"}
            <span className="lime">.</span>
          </h1>
          <p>Tu plan está aquí. El siguiente paso lo das tú.</p>
        </div>
        <Link href="/calendar/edit" className="button secondary">
          <Pencil size={16} />
          Editar calendario
        </Link>
      </section>

      <section className="hero-card">
        <div className="hero-copy">
          <span className="pill">
            <span />
            CADA REPETICIÓN CUENTA
          </span>
          <h2>
            Entrena con intención.
            <br />
            <span>Avanza a tu ritmo.</span>
          </h2>
          <p>
            Una semana organizada es el primer paso.
            <br className="desktop-only" /> Construye una rutina que se mueva contigo.
          </p>
          <Link href="/calendar/edit" className="hero-link">
            Diseñar mi semana <ArrowUpRight size={18} />
          </Link>
        </div>
        <WorkoutArt />
      </section>

      <section className="stats-grid" aria-label="Resumen de tu plan">
        <div className="stat-card">
          <span className="stat-icon">
            <CalendarDays size={21} />
          </span>
          <div>
            <span>Días de entrenamiento</span>
            <strong>
              {ready ? String(trainingDays).padStart(2, "0") : "—"}
              <small>/ 7 días</small>
            </strong>
          </div>
          <span className="stat-caption">TU SEMANA</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">
            <Dumbbell size={21} />
          </span>
          <div>
            <span>Ejercicios planificados</span>
            <strong>
              {ready ? String(totalExercises).padStart(2, "0") : "—"}
              <small>ejercicios</small>
            </strong>
          </div>
          <span className="stat-caption">EN TU PLAN</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">
            <Layers3 size={21} />
          </span>
          <div>
            <span>Series por semana</span>
            <strong>
              {ready ? String(totalSets).padStart(2, "0") : "—"}
              <small>series</small>
            </strong>
          </div>
          <span className="stat-caption">PASO A PASO</span>
        </div>
      </section>

      <section className="week-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">EL PLAN</span>
            <h2>
              Tu semana de entrenamiento<span className="lime">.</span>
            </h2>
          </div>
          <div className="week-controls">
            <button
              className="icon-button"
              aria-label="Semana anterior"
              onClick={() => setWeekOffset((n) => n - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            <span>{monday ? weekLabel(monday) : "Cargando semana…"}</span>
            <button
              className="icon-button"
              aria-label="Semana siguiente"
              onClick={() => setWeekOffset((n) => n + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        {weekOffset !== 0 && (
          <div className="week-note">
            Tu rutina se repite cada semana.
            <button className="text-button" onClick={() => setWeekOffset(0)}>
              Volver a esta semana
            </button>
          </div>
        )}
        <div className="days-grid" aria-label="Selecciona un día">
          {plan.map((day, index) => (
            <DayCard
              key={day.day_of_week}
              day={day}
              date={monday ? dayDate(monday, index) : null}
              selected={selected === index}
              today={Boolean(
                now && monday && localDateKey(dayDate(monday, index)) === localDateKey(now),
              )}
              onClick={() => setSelected(index)}
            />
          ))}
        </div>
        <div className="week-legend">
          <span>
            <i />
            Entrenamiento seleccionado
          </span>
          <span>
            <i className="legend-today" />
            Hoy
          </span>
          <span className="recurring-note">Tu rutina semanal, a tu medida</span>
        </div>
      </section>

      <section className="daily-section" aria-busy={!ready}>
        <div className="section-heading">
          <div className="daily-title">
            <span className="daily-title-icon">
              {day.exercises.length ? <Flame size={22} /> : <Moon size={22} />}
            </span>
            <div>
              <span className="eyebrow">
                {DAYS[selected].toUpperCase()} /{" "}
                {monday
                  ? dayDate(monday, selected)
                      .toLocaleDateString("es-CL", { day: "numeric", month: "long" })
                      .toUpperCase()
                  : "TU DÍA"}
              </span>
              <h2>{day.muscle_focus}</h2>
            </div>
          </div>
          <span className="count-pill">
            {day.exercises.length} ejercicios <span>·</span>{" "}
            {day.exercises.reduce((s, e) => s + e.sets, 0)} series
          </span>
        </div>
        {!ready ? (
          <div className="empty-state">
            <div className="loading-ring" />
            <p>Cargando tu rutina…</p>
          </div>
        ) : day.exercises.length ? (
          <>
            <div className="daily-progress">
              <span>
                {done === day.exercises.length ? (
                  <CircleCheck size={15} />
                ) : (
                  <span className="progress-dot" />
                )}
                <span>
                  {done === day.exercises.length
                    ? "¡Entrenamiento completado!"
                    : "Tu progreso de este día"}
                </span>
                <strong>
                  {done} / {day.exercises.length}
                </strong>
              </span>
              <div className="progress-track">
                <div style={{ width: `${(done / day.exercises.length) * 100}%` }} />
              </div>
            </div>
            <div className="workout-list">
              {day.exercises.map((exercise, index) => {
                const isDone = Boolean(completed[`${dateKey}:${exercise.id}`]);
                return (
                  <article
                    key={exercise.id}
                    className={`workout-row ${isDone ? "is-complete" : ""}`}
                  >
                    <span className="exercise-order">{String(index + 1).padStart(2, "0")}</span>
                    <button
                      className="exercise-preview"
                      aria-label={`Ver ${exercise.exercise_name}`}
                      onClick={() => setDetail(exercise)}
                    >
                      <ExerciseImage src={exercise.gif_url} name={exercise.exercise_name} />
                    </button>
                    <div className="workout-info">
                      <button className="exercise-name" onClick={() => setDetail(exercise)}>
                        {exercise.exercise_name}
                      </button>
                      <p>
                        {labelFor(exercise.body_part, BODY_PARTS)}
                        <span>·</span>
                        {labelFor(exercise.equipment, EQUIPMENT)}
                      </p>
                    </div>
                    <div className="exercise-prescription">
                      <strong>
                        {exercise.sets}
                        <span> SERIES</span>
                      </strong>
                      <i>×</i>
                      <strong>
                        {exercise.reps}
                        <span> REPS{exercise.reps.endsWith("s") ? " / SEG" : ""}</span>
                      </strong>
                    </div>
                    <button
                      className={`completion-button ${isDone ? "checked" : ""}`}
                      aria-label={`${isDone ? "Desmarcar" : "Completar"} ${exercise.exercise_name}`}
                      aria-pressed={isDone}
                      disabled={!monday}
                      onClick={() => toggleCompleted(`${dateKey}:${exercise.id}`)}
                    >
                      <Check size={17} />
                    </button>
                  </article>
                );
              })}
            </div>
            <p className="local-progress-note">
              Marca cada ejercicio al terminar. El progreso se guarda en este navegador.
            </p>
          </>
        ) : (
          <div className="empty-state rest-state">
            <span className="rest-icon">
              <Moon size={30} />
            </span>
            <h3>Recuperar también es avanzar.</h3>
            <p>
              {day.muscle_focus === "Descanso"
                ? "Dale a tu cuerpo espacio para volver más fuerte."
                : "Todavía no hay ejercicios para este día. Dale forma a tu entrenamiento."}
            </p>
            <Link href={`/calendar/edit?day=${day.day_of_week}`} className="button secondary">
              {day.muscle_focus === "Descanso" ? "Personalizar este día" : "Agregar ejercicios"}
              <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </section>
      <div className="bottom-insight">
        <span>
          <Sparkles size={18} />
          <strong>
            {isGuest ? "Tu rutina empieza contigo." : "Haz espacio para lo que te hace bien."}
          </strong>{" "}
          {isGuest
            ? "Tu plan de invitado se guarda en este navegador."
            : "Puedes ajustar tu calendario cuando lo necesites."}
        </span>
        <Link href={isGuest ? "/register" : "/exercises"}>
          {isGuest ? "Crear mi cuenta" : "Explorar ejercicios"}
          <ArrowUpRight size={16} />
        </Link>
      </div>
      {detail && <ExerciseDetail planned={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
