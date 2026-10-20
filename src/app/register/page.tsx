import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { AuthForm } from "@/components/auth-form";
export const metadata: Metadata = { title: "Crear cuenta" };
export const dynamic = "force-dynamic";
export default async function RegisterPage() {
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/");
  }
  return <AuthForm mode="register" configured={supabaseConfigured()} />;
}
