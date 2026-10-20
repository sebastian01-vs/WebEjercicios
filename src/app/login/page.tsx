import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Iniciar sesión" };
export const dynamic = "force-dynamic";
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/");
  }
  const { error } = await searchParams;
  return (
    <>
      {error === "confirmation" && (
        <div className="callback-error" role="alert">
          El enlace expiró o no es válido. Inicia sesión o solicita un nuevo registro.
        </div>
      )}
      <AuthForm mode="login" configured={supabaseConfigured()} />
    </>
  );
}
