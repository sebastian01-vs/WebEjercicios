export function mondayOf(date: Date) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}
export function dayDate(monday: Date, index: number) {
  const date = new Date(monday);
  date.setDate(date.getDate() + index);
  return date;
}
export function localDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
export function weekLabel(monday: Date) {
  const end = dayDate(monday, 6);
  const startLabel = monday.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
  const endLabel = end.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${startLabel} — ${endLabel}`;
}
