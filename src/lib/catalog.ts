import type { Exercise, PlannedExercise, WeeklyPlan } from "./types";

// Offline starter catalogue. Photos: free-exercise-db, CC0 (see ATTRIBUTIONS.md).
export const CATALOG: Exercise[] = [
  {
    id: "local-bench",
    name: "Press de banca con barra",
    bodyPart: "chest",
    target: "pectorals",
    equipment: "barbell",
    gifUrl: "/exercises/bench.jpg",
    instructions: [
      "Apoya los pies y mantén la espalda estable sobre el banco.",
      "Baja la barra de forma controlada hasta el pecho.",
      "Empuja sin bloquear los codos de forma brusca.",
    ],
  },
  {
    id: "local-incline",
    name: "Press inclinado con mancuernas",
    bodyPart: "chest",
    target: "pectorals",
    equipment: "dumbbell",
    gifUrl: "/exercises/incline.jpg",
    instructions: [
      "Ajusta el banco a unos 30 grados.",
      "Empuja las mancuernas hacia arriba manteniendo las muñecas alineadas.",
      "Regresa lentamente a la posición inicial.",
    ],
  },
  {
    id: "local-fly",
    name: "Aperturas con mancuernas",
    bodyPart: "chest",
    target: "pectorals",
    equipment: "dumbbell",
    gifUrl: "/exercises/fly.jpg",
    instructions: [
      "Túmbate en el banco con los codos ligeramente flexionados.",
      "Abre los brazos hasta un rango cómodo y vuelve a juntarlos con control.",
    ],
  },
  {
    id: "local-triceps",
    name: "Extensión de tríceps en polea",
    bodyPart: "upper arms",
    target: "triceps",
    equipment: "cable",
    gifUrl: "/exercises/triceps.jpg",
    instructions: [
      "Mantén los codos junto al cuerpo.",
      "Extiende los brazos y vuelve sin mover los hombros.",
    ],
  },
  {
    id: "local-pushup",
    name: "Flexiones de pecho",
    bodyPart: "chest",
    target: "pectorals",
    equipment: "body weight",
    gifUrl: "/exercises/pushup.jpg",
    instructions: [
      "Coloca las manos bajo los hombros y activa el abdomen.",
      "Baja el cuerpo en bloque y empuja hasta la posición inicial.",
    ],
  },
  {
    id: "local-row",
    name: "Remo con barra",
    bodyPart: "back",
    target: "upper back",
    equipment: "barbell",
    gifUrl: "/exercises/row.jpg",
    instructions: [
      "Inclina el torso desde la cadera con la espalda neutra.",
      "Lleva la barra hacia el abdomen sin balancear el tronco.",
    ],
  },
  {
    id: "local-pulldown",
    name: "Jalón al pecho",
    bodyPart: "back",
    target: "lats",
    equipment: "cable",
    gifUrl: "/exercises/pulldown.jpg",
    instructions: [
      "Sujeta la barra con un agarre cómodo.",
      "Llévala hacia la parte alta del pecho y regresa con control.",
    ],
  },
  {
    id: "local-curl",
    name: "Curl de bíceps con mancuernas",
    bodyPart: "upper arms",
    target: "biceps",
    equipment: "dumbbell",
    gifUrl: "/exercises/curl.jpg",
    instructions: [
      "Mantén los codos quietos junto al cuerpo.",
      "Flexiona los brazos sin balancearte y baja lentamente.",
    ],
  },
  {
    id: "local-squat",
    name: "Sentadilla con barra",
    bodyPart: "upper legs",
    target: "quads",
    equipment: "barbell",
    gifUrl: "/exercises/squat.jpg",
    instructions: [
      "Separa los pies a una anchura cómoda.",
      "Flexiona caderas y rodillas manteniendo la espalda neutra.",
      "Empuja el suelo para regresar a la posición inicial.",
    ],
  },
  {
    id: "local-lunge",
    name: "Zancadas con mancuernas",
    bodyPart: "upper legs",
    target: "glutes",
    equipment: "dumbbell",
    gifUrl: "/exercises/lunge.jpg",
    instructions: [
      "Da un paso hacia delante con el tronco estable.",
      "Baja ambas rodillas y empuja con la pierna adelantada para volver.",
    ],
  },
  {
    id: "local-legpress",
    name: "Prensa de piernas",
    bodyPart: "upper legs",
    target: "quads",
    equipment: "leverage machine",
    gifUrl: "/exercises/legpress.jpg",
    instructions: [
      "Apoya toda la espalda y coloca los pies sobre la plataforma.",
      "Flexiona las rodillas sin despegar la cadera y extiende con control.",
    ],
  },
  {
    id: "local-calf",
    name: "Elevación de pantorrillas",
    bodyPart: "lower legs",
    target: "calves",
    equipment: "body weight",
    gifUrl: "/exercises/calf.jpg",
    instructions: [
      "Apóyate para mantener el equilibrio.",
      "Eleva los talones, pausa y baja lentamente.",
    ],
  },
  {
    id: "local-shoulder",
    name: "Press de hombros con mancuernas",
    bodyPart: "shoulders",
    target: "delts",
    equipment: "dumbbell",
    gifUrl: "/exercises/shoulder.jpg",
    instructions: [
      "Empieza con las mancuernas a la altura de los hombros.",
      "Empuja hacia arriba sin arquear la espalda.",
    ],
  },
  {
    id: "local-lateral",
    name: "Elevaciones laterales",
    bodyPart: "shoulders",
    target: "delts",
    equipment: "dumbbell",
    gifUrl: "/exercises/lateral.jpg",
    instructions: [
      "Con los codos suaves, eleva los brazos hasta la altura de los hombros.",
      "Baja despacio evitando impulso.",
    ],
  },
  {
    id: "local-plank",
    name: "Plancha abdominal",
    bodyPart: "waist",
    target: "abs",
    equipment: "body weight",
    gifUrl: "/exercises/plank.jpg",
    instructions: [
      "Apoya los antebrazos y las puntas de los pies.",
      "Mantén el cuerpo alineado y respira durante toda la serie.",
    ],
  },
  {
    id: "local-crunch",
    name: "Crunch abdominal",
    bodyPart: "waist",
    target: "abs",
    equipment: "body weight",
    gifUrl: "/exercises/crunch.jpg",
    instructions: [
      "Túmbate con las rodillas flexionadas.",
      "Eleva ligeramente los hombros contrayendo el abdomen sin tirar del cuello.",
    ],
  },
];

export function toPlanned(exercise: Exercise, order: number): PlannedExercise {
  return {
    id: crypto.randomUUID(),
    exercise_id: exercise.id,
    exercise_name: exercise.name,
    body_part: exercise.bodyPart,
    equipment: exercise.equipment,
    gif_url: exercise.gifUrl,
    sets: 3,
    reps: exercise.id === "local-plank" ? "30s" : "10-12",
    order_index: order,
  };
}

export function emptyPlan(): WeeklyPlan {
  return Array.from({ length: 7 }, (_, i) => ({
    day_of_week: i + 1,
    muscle_focus: "Descanso",
    exercises: [],
  }));
}

export function starterPlan(): WeeklyPlan {
  const assignments = [
    { focus: "Pecho y tríceps", ids: [0, 1, 2, 3] },
    { focus: "Espalda y bíceps", ids: [5, 6, 7] },
    { focus: "Piernas", ids: [8, 9, 10, 11] },
    { focus: "Descanso", ids: [] },
    { focus: "Hombros y abdomen", ids: [12, 13, 14, 15] },
    { focus: "Full body", ids: [4, 8, 5] },
    { focus: "Descanso", ids: [] },
  ];
  return assignments.map((day, i) => ({
    day_of_week: i + 1,
    muscle_focus: day.focus,
    exercises: day.ids.map((id, order) => toPlanned(CATALOG[id], order)),
  }));
}
