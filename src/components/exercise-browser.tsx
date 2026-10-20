"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Dumbbell, Plus, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { BODY_PARTS, EQUIPMENT, exerciseSchema, labelFor, type Exercise } from "@/lib/types";
import { ExerciseImage } from "./exercise-image";
import { z } from "zod";

const responseSchema = z.object({
  exercises: z.array(exerciseSchema),
  source: z.enum(["sample", "exercisedb"]),
  hasMore: z.boolean(),
  nextOffset: z.number().int().nonnegative(),
});

export function ExerciseBrowser({
  onSelect,
  selectedIds = [],
  disabled = false,
}: {
  onSelect: (exercise: Exercise) => void;
  selectedIds?: string[];
  disabled?: boolean;
}) {
  const [filters, setFilters] = useState({ q: "", bodyPart: "", equipment: "" });
  const [items, setItems] = useState<Exercise[]>([]);
  const [source, setSource] = useState<"sample" | "exercisedb" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [retryKey, setRetryKey] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (offset: number, append: boolean, controller: AbortController) => {
      setLoading(true);
      setError(null);
      if (!append) setItems([]);
      try {
        const params = new URLSearchParams({ ...filters, limit: "24", offset: String(offset) });
        const response = await fetch(`/api/exercises?${params}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "No pudimos cargar los ejercicios.");
        const valid = responseSchema.parse(data);
        if (controller.signal.aborted) return;
        setItems((previous) =>
          append
            ? [...previous, ...valid.exercises.filter((e) => !previous.some((p) => p.id === e.id))]
            : valid.exercises,
        );
        setSource(valid.source);
        setHasMore(valid.hasMore);
        setNextOffset(valid.nextOffset);
      } catch (error) {
        if (!controller.signal.aborted)
          setError(error instanceof Error ? error.message : "Ocurrió un error al cargar.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current?.abort();
    controllerRef.current = controller;
    const timer = setTimeout(() => {
      void load(0, false, controller);
    }, 250);
    return () => {
      clearTimeout(timer);
      controllerRef.current?.abort();
    };
  }, [load, retryKey]);

  function updateFilters(next: typeof filters) {
    controllerRef.current?.abort();
    setFilters(next);
    setLoading(true);
    setItems([]);
    setError(null);
    setHasMore(false);
  }
  function loadMore() {
    const controller = new AbortController();
    controllerRef.current = controller;
    void load(nextOffset, true, controller);
  }
  return (
    <div className="exercise-browser">
      <div className="browser-filters">
        <label className="search-field">
          <Search size={18} />
          <input
            aria-label="Buscar ejercicio"
            placeholder="Busca un ejercicio…"
            value={filters.q}
            onChange={(e) => updateFilters({ ...filters, q: e.target.value })}
          />
          {filters.q && (
            <button
              className="text-button"
              aria-label="Limpiar búsqueda"
              onClick={() => updateFilters({ ...filters, q: "" })}
            >
              ×
            </button>
          )}
        </label>
        <div className="filter-selects">
          <SlidersHorizontal size={17} />
          <label>
            <span className="sr-only">Grupo muscular</span>
            <select
              value={filters.bodyPart}
              onChange={(e) => updateFilters({ ...filters, bodyPart: e.target.value })}
            >
              <option value="">Todos los músculos</option>
              {BODY_PARTS.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Equipamiento</span>
            <select
              value={filters.equipment}
              onChange={(e) => updateFilters({ ...filters, equipment: e.target.value })}
            >
              <option value="">Todo el equipamiento</option>
              {EQUIPMENT.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="browser-meta" aria-live="polite">
        <span>
          {loading && items.length === 0
            ? "Buscando ejercicios…"
            : `${items.length} ejercicios disponibles`}
        </span>
        {source && (
          <span className="source-label">
            <span />
            {source === "sample" ? "Catálogo de ejemplo · fotos" : "ExerciseDB · animaciones"}
          </span>
        )}
      </div>
      {error && (
        <div className="inline-error" role="alert">
          <p>{error}</p>
          <button
            className="button secondary"
            onClick={() => {
              setLoading(true);
              setRetryKey((v) => v + 1);
            }}
          >
            <RotateCcw size={15} />
            Reintentar
          </button>
        </div>
      )}
      <div className="catalog-grid" aria-busy={loading}>
        {items.map((exercise) => {
          const selected = selectedIds.includes(exercise.id);
          return (
            <article className="catalog-card" key={exercise.id}>
              <div className="catalog-image-wrap">
                <ExerciseImage src={exercise.gifUrl} name={exercise.name} />
                <span className="image-chip">{labelFor(exercise.bodyPart, BODY_PARTS)}</span>
              </div>
              <div className="catalog-card-body">
                <p>{labelFor(exercise.equipment, EQUIPMENT)}</p>
                <h3>{exercise.name}</h3>
                {exercise.instructions.length > 0 && (
                  <details className="exercise-instructions">
                    <summary>Ver técnica</summary>
                    <ol>
                      {exercise.instructions.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ol>
                  </details>
                )}
                <button
                  className={`button ${selected ? "selected-button" : "secondary"}`}
                  disabled={disabled || selected}
                  onClick={() => onSelect(exercise)}
                >
                  {selected ? <Check size={16} /> : <Plus size={16} />}
                  {selected ? "Añadido al día" : "Añadir al día"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {loading && (
        <div className="browser-loading" role="status">
          <div className="loading-ring" />
          <span>Cargando ejercicios…</span>
        </div>
      )}
      {!loading && !error && !items.length && (
        <div className="empty-state">
          <Dumbbell size={35} />
          <h3>No encontramos coincidencias</h3>
          <p>
            Prueba otro nombre o cambia los filtros.
            {hasMore ? " Hay más resultados del proveedor para explorar." : ""}
          </p>
          {!hasMore && (
            <button
              className="button secondary"
              onClick={() => updateFilters({ q: "", bodyPart: "", equipment: "" })}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}
      {hasMore && !error && (
        <div className="load-more">
          <button className="button secondary" onClick={loadMore} disabled={loading}>
            {loading ? "Cargando…" : "Cargar más ejercicios"}
          </button>
          <p>Los filtros combinados se aplican a cada página del proveedor.</p>
        </div>
      )}
    </div>
  );
}
