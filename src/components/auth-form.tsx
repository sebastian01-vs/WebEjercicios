"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Brand } from "./brand";
import { WorkoutArt } from "./workout-art";

export function AuthForm({
  mode,
  configured,
}: {
  mode: "login" | "register";
  configured: boolean;
}) {
  const register = mode === "register";
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || pending) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));
    const name = String(form.get("name") || "").trim();
    if (register && (!name || name.length > 80)) {
      setError("Escribe tu nombre (hasta 80 caracteres).");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const supabase = createClient();
      if (register) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name }, emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) {
          setError(
            error.status === 429
              ? "Demasiados intentos. Espera unos minutos antes de volver a intentarlo."
              : "No pudimos crear la cuenta. Revisa los datos; si ya tienes una cuenta, inicia sesión.",
          );
          return;
        }
        if (!data.session) {
          setConfirmation(true);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError(
            error.status === 429
              ? "Demasiados intentos. Inténtalo en unos minutos."
              : "No pudimos iniciar sesión. Revisa tu email, contraseña y la confirmación de tu cuenta.",
          );
          return;
        }
      }
      // Use a full navigation to clear any guest planner state on authentication.
      router.replace("/");
      router.refresh();
    } catch {
      setError("No pudimos conectar. Comprueba tu conexión e inténtalo de nuevo.");
    } finally {
      setPending(false);
    }
  }
  return (
    <main id="main" className="auth-layout">
      <section className="auth-art-panel">
        <Link href="/" aria-label="Pulso, inicio">
          <Brand />
        </Link>
        <div className="auth-art-content">
          <span className="pill">
            <span />
            TU RITMO. TU PROCESO.
          </span>
          <h1>
            El cambio empieza
            <br />
            con un <span>plan.</span>
          </h1>
          <p>
            Organiza tu entrenamiento.
            <br />
            Construye tu mejor versión, día a día.
          </p>
          <WorkoutArt />
        </div>
        <span className="auth-art-footer">ENFOQUE. FUERZA. CONSTANCIA.</span>
      </section>
      <section className="auth-form-panel">
        <Link href="/" className="back-link">
          <ArrowLeft size={15} />
          {configured ? "Volver al inicio" : "Explorar como invitado"}
        </Link>
        <div className="auth-form-wrap">
          <div className="mobile-auth-brand">
            <Brand />
          </div>
          {confirmation ? (
            <div className="confirmation-state">
              <CheckCircle2 size={44} />
              <span className="eyebrow">CASI LISTO</span>
              <h2>
                Revisa tu correo<span className="lime">.</span>
              </h2>
              <p>
                Te enviamos un enlace para confirmar tu cuenta. Ábrelo para empezar a construir tu
                rutina.
              </p>
              <p className="helper-text">Si no aparece, revisa la carpeta de spam.</p>
              <Link className="button primary full-width" href="/login">
                Volver a iniciar sesión
                <ArrowRight size={17} />
              </Link>
            </div>
          ) : (
            <>
              <span className="eyebrow">
                {register ? "TU SIGUIENTE PASO" : "VUELVE A TU RITMO"}
              </span>
              <h2>
                {register ? "Empieza tu camino" : "Qué bueno verte"}
                <span className="lime">.</span>
              </h2>
              <p className="auth-subtitle">
                {register
                  ? "Crea tu cuenta y dale estructura a tus objetivos."
                  : "Entra a tu espacio. Tu próxima sesión te espera."}
              </p>
              {!configured && (
                <div className="auth-guest-notice">
                  <strong>Puedes empezar como invitado.</strong>
                  <p>
                    Las cuentas estarán disponibles cuando se conecte el servicio de acceso.
                    Mientras tanto, tu rutina se guarda en este navegador.
                  </p>
                  <Link href="/" className="text-button">
                    Ir a mi rutina
                    <ArrowRight size={15} />
                  </Link>
                </div>
              )}
              <form onSubmit={submit} className="auth-form">
                {register && (
                  <label className="field-label">
                    Tu nombre
                    <div className="input-with-icon">
                      <UserRound size={17} />
                      <input
                        name="name"
                        required
                        minLength={1}
                        maxLength={80}
                        autoComplete="name"
                        placeholder="¿Cómo te llamas?"
                        disabled={!configured || pending}
                      />
                    </div>
                  </label>
                )}
                <label className="field-label">
                  Email
                  <div className="input-with-icon">
                    <Mail size={17} />
                    <input
                      name="email"
                      type="email"
                      required
                      maxLength={254}
                      autoComplete="email"
                      placeholder="tu@email.com"
                      disabled={!configured || pending}
                    />
                  </div>
                </label>
                <label className="field-label">
                  Contraseña
                  <div className="input-with-icon">
                    <LockKeyhole size={17} />
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={register ? 8 : 1}
                      maxLength={128}
                      autoComplete={register ? "new-password" : "current-password"}
                      placeholder={register ? "Al menos 8 caracteres" : "Tu contraseña"}
                      disabled={!configured || pending}
                    />
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </label>
                {error && (
                  <p className="inline-error" role="alert">
                    {error}
                  </p>
                )}
                <button
                  className="button primary full-width"
                  type="submit"
                  disabled={!configured || pending}
                >
                  {pending ? "Un momento…" : register ? "Crear mi cuenta" : "Iniciar sesión"}
                  <ArrowRight size={17} />
                </button>
              </form>
              <p className="auth-switch">
                {register ? "¿Ya tienes una cuenta?" : "¿Es tu primera vez?"}{" "}
                <Link href={register ? "/login" : "/register"}>
                  {register ? "Inicia sesión" : "Crea tu cuenta"}
                </Link>
              </p>
              <div className="auth-security">
                <LockKeyhole size={13} />
                Tu espacio personal. Tu rutina privada.
              </div>
            </>
          )}
        </div>
        <span className="auth-panel-footer">Pequeños pasos. Grandes cambios.</span>
      </section>
    </main>
  );
}
