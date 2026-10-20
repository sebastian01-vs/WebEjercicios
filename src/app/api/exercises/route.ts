import { NextRequest, NextResponse } from "next/server";
import { CATALOG } from "@/lib/catalog";
import {
  exerciseQuerySchema,
  filterExercises,
  parseProviderExercises,
  providerPath,
} from "@/lib/exercise-api";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const parsed = exerciseQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success)
    return NextResponse.json({ error: "Los filtros no son válidos." }, { status: 400 });
  const query = parsed.data;
  const key = process.env.EXERCISE_DB_API_KEY;
  const supabase = await createClient();

  if (!key || !supabase) {
    const filtered = filterExercises(CATALOG, query);
    const exercises = filtered.slice(query.offset, query.offset + query.limit);
    return NextResponse.json({
      exercises,
      source: "sample",
      hasMore: query.offset + exercises.length < filtered.length,
      nextOffset: query.offset + exercises.length,
    });
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user)
    return NextResponse.json(
      { error: "Inicia sesión para consultar ejercicios." },
      { status: 401 },
    );

  // The destination is deliberately allowlisted so a config typo cannot leak the key.
  const host = process.env.EXERCISE_DB_HOST || "exercisedb.p.rapidapi.com";
  if (host !== "exercisedb.p.rapidapi.com")
    return NextResponse.json(
      { error: "El proveedor de ejercicios no está configurado correctamente." },
      { status: 503 },
    );
  const url = new URL(`https://${host}${providerPath(query)}`);
  url.searchParams.set("limit", String(query.limit));
  url.searchParams.set("offset", String(query.offset));
  try {
    const response = await fetch(url, {
      headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": host },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Exercise provider returned ${response.status}`);
    const batch = parseProviderExercises(await response.json());
    return NextResponse.json(
      {
        exercises: filterExercises(batch, query),
        source: "exercisedb",
        hasMore: batch.length === query.limit,
        nextOffset: query.offset + batch.length,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "No pudimos cargar ExerciseDB. Inténtalo de nuevo en unos momentos." },
      { status: 502 },
    );
  }
}
