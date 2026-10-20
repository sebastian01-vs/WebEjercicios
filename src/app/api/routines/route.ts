import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readPlan } from "@/lib/plan-store";
import { weeklyPlanSchema } from "@/lib/types";

export async function GET() {
  const supabase = await createClient();
  if (!supabase)
    return NextResponse.json({ error: "Usa el guardado local en modo invitado." }, { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  try {
    return NextResponse.json(
      { plan: await readPlan(user.id) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "No pudimos cargar tu plan." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // Cookie authentication + same-origin check protects mutations against CSRF.
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin)
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  if (!request.headers.get("content-type")?.includes("application/json"))
    return NextResponse.json({ error: "Se requiere JSON." }, { status: 415 });
  if (Number(request.headers.get("content-length") || 0) > 262144)
    return NextResponse.json({ error: "El plan es demasiado grande." }, { status: 413 });
  const supabase = await createClient();
  if (!supabase)
    return NextResponse.json({ error: "Usa el guardado local en modo invitado." }, { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "La sesión expiró. Vuelve a iniciar sesión." },
      { status: 401 },
    );
  let input: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 262144)
      return NextResponse.json({ error: "El plan es demasiado grande." }, { status: 413 });
    input = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "JSON no válido." }, { status: 400 });
  }
  const parsed = weeklyPlanSchema.safeParse(input);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Revisa tu plan." },
      { status: 400 },
    );
  // Ownership comes exclusively from auth.uid() inside this atomic SQL function.
  const { error } = await supabase.rpc("save_weekly_plan", { p_days: parsed.data });
  if (error)
    return NextResponse.json(
      { error: "No pudimos guardar el plan. Tus cambios siguen en pantalla; inténtalo de nuevo." },
      { status: 500 },
    );
  return NextResponse.json({ saved: true }, { headers: { "Cache-Control": "private, no-store" } });
}
