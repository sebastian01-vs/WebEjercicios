"use client";
import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Check } from "lucide-react";
import { ExerciseBrowser } from "./exercise-browser";
import { Modal } from "./modal";
import { usePlanner } from "./planner-provider";
import { DAYS, type Exercise } from "@/lib/types";
import { toPlanned } from "@/lib/catalog";

export function ExerciseLibrary() {
  const { plan, savePlan, ready } = usePlanner();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [day, setDay] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const alreadyAdded = Boolean(
    exercise && plan[day].exercises.some((e) => e.exercise_id === exercise.id),
  );
  async function addToDay() {
    if (!exercise || alreadyAdded || saving) return;
    const next = plan.map((d, i) =>
      i === day
        ? {
            ...d,
            muscle_focus: d.muscle_focus === "Descanso" ? "Entrenamiento" : d.muscle_focus,
            exercises: [...d.exercises, toPlanned(exercise, d.exercises.length)],
          }
        : d,
    );
    setSaving(true);
    setError(null);
    try {
      await savePlan(next);
      setExercise(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "No pudimos añadir el ejercicio.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="library-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">MOVIMIENTOS PARA CADA OBJETIVO</div>
          <h1>
            Tu biblioteca de ejercicios<span className="lime">.</span>
          </h1>
          <p>Explora, encuentra tu movimiento y llévalo a tu rutina.</p>
        </div>
        <Link className="button secondary" href="/calendar/edit">
          <CalendarDays size={17} />
          Mi calendario
        </Link>
      </div>
      <div className="library-panel">
        <ExerciseBrowser
          disabled={!ready}
          onSelect={(item) => {
            setExercise(item);
            setError(null);
          }}
        />
      </div>
      {exercise && (
        <Modal
          title="¿Cuándo lo entrenamos?"
          subtitle={exercise.name}
          onClose={() => {
            if (!saving) setExercise(null);
          }}
        >
          <label className="field-label" htmlFor="target-day">
            Añadir y guardar en
          </label>
          <select
            id="target-day"
            className="text-input"
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
          >
            {plan.map((d, i) => (
              <option key={i} value={i}>
                {DAYS[i]} · {d.muscle_focus}
              </option>
            ))}
          </select>
          <p className="helper-text">
            Se añadirá con 3 series. Puedes ajustar las repeticiones desde tu calendario.
          </p>
          {alreadyAdded && <p className="inline-info">Este ejercicio ya está en este día.</p>}
          {plan[day].exercises.length >= 30 && (
            <p className="inline-error">Este día ya tiene 30 ejercicios.</p>
          )}
          {error && (
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="button primary full-width"
            disabled={saving || alreadyAdded || plan[day].exercises.length >= 30}
            onClick={addToDay}
          >
            <Check size={16} />
            {saving ? "Guardando…" : "Añadir y guardar"}
          </button>
        </Modal>
      )}
    </div>
  );
}
