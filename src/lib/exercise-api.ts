import { z } from "zod";
import { BODY_PARTS, EQUIPMENT, exerciseSchema, type Exercise } from "./types";

export const exerciseQuerySchema = z.object({
  bodyPart: z
    .string()
    .default("")
    .refine((v) => !v || BODY_PARTS.some(([key]) => key === v), "Zona corporal no válida"),
  equipment: z
    .string()
    .default("")
    .refine((v) => !v || EQUIPMENT.some(([key]) => key === v), "Equipamiento no válido"),
  q: z.string().trim().max(100).default(""),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  offset: z.coerce.number().int().min(0).max(10000).default(0),
});
export type ExerciseQuery = z.infer<typeof exerciseQuerySchema>;

export function filterExercises(exercises: Exercise[], query: ExerciseQuery) {
  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  return exercises.filter(
    (e) =>
      (!query.bodyPart || e.bodyPart === query.bodyPart) &&
      (!query.equipment || e.equipment === query.equipment) &&
      (!query.q || normalize(`${e.name} ${e.target}`).includes(normalize(query.q))),
  );
}

export function providerPath(query: ExerciseQuery) {
  if (query.bodyPart) return `/exercises/bodyPart/${encodeURIComponent(query.bodyPart)}`;
  if (query.equipment) return `/exercises/equipment/${encodeURIComponent(query.equipment)}`;
  if (query.q) return `/exercises/name/${encodeURIComponent(query.q)}`;
  return "/exercises";
}

export function parseProviderExercises(data: unknown): Exercise[] {
  return z.array(exerciseSchema).parse(data);
}
