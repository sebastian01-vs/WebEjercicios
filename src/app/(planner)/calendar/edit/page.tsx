import type { Metadata } from "next";
import { CalendarEditor } from "@/components/calendar-editor";
export const metadata: Metadata = { title: "Editar calendario" };
export default function EditPage() {
  return <CalendarEditor />;
}
