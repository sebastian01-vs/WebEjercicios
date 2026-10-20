import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { PlannerUser } from "./types";

export async function plannerSession(): Promise<{ user: PlannerUser | null; isGuest: boolean }> {
  const supabase = await createClient();
  if (!supabase) return { user: null, isGuest: true };
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  const { data: profile } = await supabase
    .from("users")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();
  return {
    isGuest: false,
    user: {
      id: user.id,
      email: user.email ?? "",
      name: profile?.name || user.user_metadata?.name || "Atleta",
    },
  };
}
