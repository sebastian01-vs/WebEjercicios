"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Dumbbell,
  GripVertical,
  Moon,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { usePlanner } from "./planner-provider";
import { ExerciseImage } from "./exercise-image";
import { Modal } from "./modal";
import { ExerciseBrowser } from "./exercise-browser";
import { DAYS, weeklyPlanSchema, type Exercise, type WeeklyPlan } from "@/lib/types";
import { toPlanned } from "@/lib/catalog";

export function CalendarEditor() {
  const { plan, ready, savePlan, isGuest } = usePlanner();
  const [draft, setDraft] = useState<WeeklyPlan | null>(null);
  const [selected, setSelected] = useState(0);
  const [picker, setPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const dirtyRef = useRef(false);
  const current = draft ?? plan;
  const dirty = JSON.stringify(current) !== JSON.stringify(plan);
  const day = current[selected];

  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  useEffect(() => {
    const initialDay = Number(new URLSearchParams(window.location.search).get("day"));
    // Read URL state once after hydration without wrapping the editor in Suspense.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (initialDay >= 1 && initialDay <= 7) setSelected(initialDay - 1);
    const handleUnload = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) event.preventDefault();
    };
    const handleClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
      if (
        !dirtyRef.current ||
        !anchor ||
        anchor.origin !== window.location.origin ||
        anchor.pathname === window.location.pathname
      )
        return;
      if (!window.confirm("Tienes cambios sin guardar. ¿Quieres salir del editor?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    document.addEventListener("click", handleClick, true);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  function updateDay(update: Partial<WeeklyPlan[number]>) {
    setDraft(current.map((d, i) => (i === selected ? { ...d, ...update } : d)));
    setSaved(false);
    setError(null);
  }
  function addExercise(exercise: Exercise) {
    if (day.exercises.length >= 30 || day.exercises.some((e) => e.exercise_id === exercise.id))
      return;
    updateDay({
      exercises: [...day.exercises, toPlanned(exercise, day.exercises.length)],
      muscle_focus: day.muscle_focus === "Descanso" ? "Entrenamiento" : day.muscle_focus,
    });
  }
  function removeExercise(id: string) {
    updateDay({
      exercises: day.exercises
        .filter((e) => e.id !== id)
        .map((e, order_index) => ({ ...e, order_index })),
    });
  }
  function moveExercise(index: number, direction: number) {
    const next = [...day.exercises];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    updateDay({ exercises: next.map((e, order_index) => ({ ...e, order_index })) });
  }
  async function save() {
    const valid = weeklyPlanSchema.safeParse(current);
    if (!valid.success) {
      setError(valid.error.issues[0]?.message || "Revisa los datos del plan.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await savePlan(valid.data);
      setDraft(null);
      setSaved(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "No pudimos guardar el plan.");
    } finally {
      setSaving(false);
    }
  }
  if (!ready)
    return (
      <div className="empty-state">
        <div className="loading-ring" />
        <p>Cargando tu calendario…</p>
      </div>
    );
  return (
    <div className="editor-page">
      <Link href="/" className="back-link">
        <ArrowLeft size={15} />
        Volver a mi rutina
      </Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">UN PLAN QUE SE ADAPTA A TI</div>
          <h1>
            Diseña tu semana<span className="lime">.</span>
          </h1>
          <p>Elige tu enfoque, añade ejercicios y hazlo tuyo.</p>
        </div>
        <button className="button primary" onClick={save} disabled={saving || (!dirty && saved)}>
          {saved && !dirty ? <Check size={17} /> : <Save size={17} />}
          {saving ? "Guardando…" : saved && !dirty ? "Plan guardado" : "Guardar plan"}
        </button>
      </div>
      <div className="editor-notice">
        <span className={dirty ? "unsaved-dot" : "status-dot"} />
        <span>
          {dirty
            ? "Tienes cambios sin guardar"
            : "Tu rutina se repite cada semana. Puedes cambiarla cuando quieras."}
        </span>
        <span>{isGuest ? "Guardado en este navegador" : "Guardado en tu cuenta"}</span>
      </div>
      {error && (
        <div className="inline-error" role="alert">
          {error}
        </div>
      )}
      <fieldset disabled={saving} className="editor-layout">
        <nav className="editor-days" aria-label="Día a editar">
          {current.map((d, index) => (
            <button
              key={d.day_of_week}
              className={`editor-day ${selected === index ? "active" : ""}`}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
            >
              <span className="editor-day-number">0{index + 1}</span>
              <span>
                <strong>{DAYS[index]}</strong>
                <small>{d.muscle_focus || "Sin enfoque"}</small>
              </span>
              <span className="editor-day-count">{d.exercises.length || <Moon size={13} />}</span>
            </button>
          ))}
        </nav>
        <section className="day-editor">
          <div className="day-editor-heading">
            <div>
              <span className="eyebrow">
                DÍA 0{selected + 1} / {DAYS[selected].toUpperCase()}
              </span>
              <h2>Tu entrenamiento</h2>
            </div>
            <span className="stat-icon">
              <Dumbbell size={23} />
            </span>
          </div>
          <label className="field-label" htmlFor="muscle-focus">
            Enfoque del día
          </label>
          <input
            id="muscle-focus"
            className="text-input focus-input"
            value={day.muscle_focus}
            maxLength={60}
            placeholder="Ej. Pecho y tríceps"
            onChange={(e) => updateDay({ muscle_focus: e.target.value })}
          />
          <p className="helper-text">Escribe los grupos musculares o el objetivo de tu sesión.</p>
          <div className="editor-exercises-heading">
            <h3>
              Ejercicios <span>{day.exercises.length}</span>
            </h3>
            <span>SERIES / REPETICIONES</span>
          </div>
          <div className="editor-exercises">
            {day.exercises.map((exercise, index) => (
              <article key={exercise.id} className="editable-exercise">
                <span className="grip">
                  <GripVertical size={16} />
                </span>
                <ExerciseImage src={exercise.gif_url} name={exercise.exercise_name} />
                <div className="editable-name">
                  <strong>{exercise.exercise_name}</strong>
                  <div className="reorder-controls">
                    <button
                      className="text-button"
                      aria-label={`Subir ${exercise.exercise_name}`}
                      disabled={index === 0}
                      onClick={() => moveExercise(index, -1)}
                    >
                      <ArrowUp size={13} />
                      Subir
                    </button>
                    <button
                      className="text-button"
                      aria-label={`Bajar ${exercise.exercise_name}`}
                      disabled={index === day.exercises.length - 1}
                      onClick={() => moveExercise(index, 1)}
                    >
                      <ArrowDown size={13} />
                      Bajar
                    </button>
                  </div>
                </div>
                <div className="prescription-inputs">
                  <label>
                    <span className="sr-only">Series de {exercise.exercise_name}</span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={exercise.sets || ""}
                      aria-label={`Series de ${exercise.exercise_name}`}
                      onChange={(e) =>
                        updateDay({
                          exercises: day.exercises.map((item) =>
                            item.id === exercise.id
                              ? { ...item, sets: Number(e.target.value) }
                              : item,
                          ),
                        })
                      }
                    />
                  </label>
                  <span>×</span>
                  <label>
                    <span className="sr-only">Repeticiones de {exercise.exercise_name}</span>
                    <input
                      value={exercise.reps}
                      maxLength={15}
                      placeholder="8-12"
                      aria-label={`Repeticiones de ${exercise.exercise_name}`}
                      onChange={(e) =>
                        updateDay({
                          exercises: day.exercises.map((item) =>
                            item.id === exercise.id ? { ...item, reps: e.target.value } : item,
                          ),
                        })
                      }
                    />
                  </label>
                </div>
                <button
                  className="icon-button danger-button"
                  aria-label={`Eliminar ${exercise.exercise_name}`}
                  onClick={() => removeExercise(exercise.id)}
                >
                  <Trash2 size={17} />
                </button>
              </article>
            ))}
          </div>
          {!day.exercises.length && (
            <div className="empty-state editor-empty">
              <Dumbbell size={33} />
              <h3>Un día lleno de posibilidades.</h3>
              <p>Añade tu primer ejercicio o disfruta de un día de descanso.</p>
            </div>
          )}
          <button
            className="add-exercise-button"
            disabled={day.exercises.length >= 30}
            onClick={() => setPicker(true)}
          >
            <Plus size={19} />
            {day.exercises.length >= 30 ? "Límite de 30 ejercicios por día" : "Agregar ejercicio"}
          </button>
          <p className="helper-text prescription-help">
            Puedes usar 10, 8-12 o 30s para las repeticiones. De 1 a 20 series por ejercicio.
          </p>
        </section>
      </fieldset>
      <div className="editor-save-bar">
        <div>
          <strong>Tu plan, a tu manera.</strong>
          <p>Guarda los cambios de los 7 días en un solo paso.</p>
        </div>
        <button className="button primary" disabled={saving || (!dirty && saved)} onClick={save}>
          <Save size={16} />
          {saving ? "Guardando…" : "Guardar plan"}
        </button>
      </div>
      {picker && (
        <Modal
          wide
          title="Encuentra tu próximo ejercicio"
          subtitle={`Añadiendo a ${DAYS[selected]} · ${day.muscle_focus}`}
          onClose={() => setPicker(false)}
        >
          <ExerciseBrowser
            onSelect={addExercise}
            selectedIds={day.exercises.map((e) => e.exercise_id)}
            disabled={day.exercises.length >= 30}
          />
          <div className="picker-footer">
            <span>
              {day.exercises.length} ejercicios en {DAYS[selected].toLowerCase()}
            </span>
            <button className="button primary" onClick={() => setPicker(false)}>
              <Check size={16} />
              Listo
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
