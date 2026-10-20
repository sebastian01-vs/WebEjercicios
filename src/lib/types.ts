import { z } from "zod";

export const DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;
export const BODY_PARTS = [
  ["chest", "Pecho"],
  ["back", "Espalda"],
  ["upper legs", "Piernas"],
  ["lower legs", "Pantorrillas"],
  ["shoulders", "Hombros"],
  ["upper arms", "Brazos"],
  ["waist", "Abdominales"],
  ["cardio", "Cardio"],
] as const;
export const EQUIPMENT = [
  ["barbell", "Barra"],
  ["dumbbell", "Mancuernas"],
  ["cable", "Polea"],
  ["leverage machine", "Máquina"],
  ["body weight", "Peso corporal"],
] as const;

export const exerciseSchema = z.object({
  id: z.string().min(1).max(120),
  name: z.string().trim().min(1).max(160),
  bodyPart: z.string().min(1).max(80),
  target: z.string().min(1).max(80),
  equipment: z.string().min(1).max(80),
  gifUrl: z
    .string()
    .max(2048)
    .refine((v) => !v || v.startsWith("/exercises/") || /^https:\/\//.test(v), "URL no permitida"),
  instructions: z.array(z.string().max(1500)).max(20).default([]),
});
export type Exercise = z.infer<typeof exerciseSchema>;

export const plannedExerciseSchema = z.object({
  id: z.uuid(),
  exercise_id: z.string().min(1).max(120),
  exercise_name: z.string().trim().min(1).max(160),
  body_part: z.string().min(1).max(80),
  equipment: z.string().min(1).max(80),
  gif_url: exerciseSchema.shape.gifUrl,
  sets: z
    .number()
    .int("Las series deben ser un número entero")
    .min(1, "Usa entre 1 y 20 series por ejercicio")
    .max(20, "Usa entre 1 y 20 series por ejercicio"),
  reps: z
    .string()
    .trim()
    .regex(/^\d{1,3}(?:\s*[-–]\s*\d{1,3})?(?:\s*s)?$/, "Usa 10, 8-12 o 30s"),
  order_index: z.number().int().min(0).max(29),
});
export type PlannedExercise = z.infer<typeof plannedExerciseSchema>;

export const routineDaySchema = z.object({
  day_of_week: z.number().int().min(1).max(7),
  muscle_focus: z.string().trim().min(1, "Indica un enfoque").max(60),
  exercises: z.array(plannedExerciseSchema).max(30),
});
export const weeklyPlanSchema = z
  .array(routineDaySchema)
  .length(7)
  .superRefine((days, ctx) => {
    if (new Set(days.map((d) => d.day_of_week)).size !== 7) {
      ctx.addIssue({
        code: "custom",
        message: "El plan debe contener una vez cada día de la semana",
      });
    }
    if (days.some((day, index) => day.day_of_week !== index + 1)) {
      ctx.addIssue({ code: "custom", message: "Ordena los días de lunes a domingo" });
    }
    const ids = days.flatMap((d) => d.exercises.map((e) => e.id));
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({
        code: "custom",
        message: "Los ejercicios del plan deben tener identificadores únicos",
      });
    for (const day of days) {
      if (day.exercises.some((exercise, index) => exercise.order_index !== index)) {
        ctx.addIssue({
          code: "custom",
          message: "El orden de los ejercicios debe ser consecutivo",
        });
      }
    }
  });
export type RoutineDay = z.infer<typeof routineDaySchema>;
export type WeeklyPlan = z.infer<typeof weeklyPlanSchema>;
export type PlannerUser = { id: string; name: string; email: string };

export function labelFor(value: string, options: readonly (readonly [string, string])[]) {
  return options.find(([key]) => key === value)?.[1] ?? value;
}
