"use client";
import { Modal } from "./modal";
import { ExerciseImage } from "./exercise-image";
import { CATALOG } from "@/lib/catalog";
import { BODY_PARTS, EQUIPMENT, labelFor, type PlannedExercise } from "@/lib/types";

export function ExerciseDetail({
  planned,
  onClose,
}: {
  planned: PlannedExercise;
  onClose: () => void;
}) {
  const instructions = CATALOG.find((e) => e.id === planned.exercise_id)?.instructions ?? [];
  return (
    <Modal
      title={planned.exercise_name}
      subtitle={`${labelFor(planned.body_part, BODY_PARTS)} · ${labelFor(planned.equipment, EQUIPMENT)}`}
      onClose={onClose}
    >
      <ExerciseImage src={planned.gif_url} name={planned.exercise_name} className="detail-image" />
      <div className="detail-prescription">
        <span>
          <strong>{planned.sets}</strong> series
        </span>
        <span>
          <strong>{planned.reps}</strong>{" "}
          {planned.reps.endsWith("s") ? "por serie" : "repeticiones"}
        </span>
      </div>
      {instructions.length > 0 && (
        <div className="instructions">
          <h3>Cómo realizarlo</h3>
          <ol>
            {instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
        </div>
      )}
      <p className="helper-text">
        Prioriza una técnica controlada y un rango de movimiento cómodo.
      </p>
    </Modal>
  );
}
