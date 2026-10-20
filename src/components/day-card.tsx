"use client";
import { ArrowUpRight, Moon } from "lucide-react";
import { DAYS, type RoutineDay } from "@/lib/types";
export function DayCard({
  day,
  date,
  selected,
  today,
  onClick,
}: {
  day: RoutineDay;
  date: Date | null;
  selected: boolean;
  today: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`day-card ${selected ? "selected" : ""} ${!day.exercises.length ? "rest-day" : ""}`}
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`${DAYS[day.day_of_week - 1]}, ${date ? date.getDate() : "cargando fecha"}, ${day.muscle_focus}`}
    >
      <div className="day-card-top">
        <span>{DAYS[day.day_of_week - 1].slice(0, 3).toUpperCase()}</span>
        {today && <span className="today-dot" title="Hoy" />}
      </div>
      <strong className="day-number">{date ? String(date.getDate()).padStart(2, "0") : "—"}</strong>
      <div className="day-focus">{day.muscle_focus}</div>
      <div className="day-card-bottom">
        {day.exercises.length ? (
          <>
            <span>{day.exercises.length} ejercicios</span>
            <ArrowUpRight size={15} />
          </>
        ) : (
          <>
            <span>Recuperación</span>
            <Moon size={14} />
          </>
        )}
      </div>
    </button>
  );
}
