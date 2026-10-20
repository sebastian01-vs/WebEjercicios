import "server-only";
import { createClient } from "./supabase/server";
import { emptyPlan } from "./catalog";
import { weeklyPlanSchema, type WeeklyPlan } from "./types";

export async function readPlan(userId: string): Promise<WeeklyPlan> {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase no configurado");
  const { data, error } = await supabase
    .from("weekly_routines")
    .select(
      "day_of_week, muscle_focus, routine_exercises(id, exercise_id, exercise_name, body_part, equipment, gif_url, sets, reps, order_index)",
    )
    .eq("user_id", userId)
    .order("day_of_week");
  if (error)
    throw new Error("No se pudo cargar tu plan. Comprueba la conexión e inténtalo de nuevo.");
  if (!data?.length) return emptyPlan();
  const days = emptyPlan().map((day) => {
    const stored = data.find((row) => row.day_of_week === day.day_of_week);
    return stored
      ? {
          day_of_week: stored.day_of_week,
          muscle_focus: stored.muscle_focus,
          exercises: [...stored.routine_exercises].sort((a, b) => a.order_index - b.order_index),
        }
      : day;
  });
  return weeklyPlanSchema.parse(days);
}
