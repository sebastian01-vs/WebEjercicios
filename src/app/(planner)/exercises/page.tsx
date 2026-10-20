import type { Metadata } from "next";
import { ExerciseLibrary } from "@/components/exercise-library";
export const metadata: Metadata = { title: "Biblioteca de ejercicios" };
export default function ExercisesPage() {
  return <ExerciseLibrary />;
}
