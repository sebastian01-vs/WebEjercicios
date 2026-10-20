"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { emptyPlan, starterPlan } from "@/lib/catalog";
import { weeklyPlanSchema, type PlannerUser, type WeeklyPlan } from "@/lib/types";

const PLAN_KEY = "pulso:plan:v1";
type PlannerContextValue = {
  user: PlannerUser | null;
  isGuest: boolean;
  plan: WeeklyPlan;
  ready: boolean;
  savePlan: (plan: WeeklyPlan) => Promise<void>;
  completed: Record<string, boolean>;
  toggleCompleted: (key: string) => void;
  notice: string | null;
  notify: (message: string) => void;
};
const PlannerContext = createContext<PlannerContextValue | null>(null);

export function PlannerProvider({
  children,
  user,
  isGuest,
  initialPlan,
}: {
  children: React.ReactNode;
  user: PlannerUser | null;
  isGuest: boolean;
  initialPlan: WeeklyPlan | null;
}) {
  const [plan, setPlan] = useState<WeeklyPlan>(initialPlan ?? emptyPlan());
  const [ready, setReady] = useState(!isGuest);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const completionKey = `pulso:completed:v1:${user?.id ?? "guest"}`;
  const notify = useCallback((message: string) => setNotice(message), []);

  useEffect(() => {
    // Synchronize browser-only storage after hydration; server output stays deterministic.
    function hydrateStorage() {
      try {
        if (isGuest) {
          const stored = localStorage.getItem(PLAN_KEY);
          const parsed = stored ? weeklyPlanSchema.safeParse(JSON.parse(stored)) : null;
          const initial = parsed?.success ? parsed.data : starterPlan();
          setPlan(initial);
          localStorage.setItem(PLAN_KEY, JSON.stringify(initial));
        }
        const raw = JSON.parse(localStorage.getItem(completionKey) || "{}");
        if (raw && typeof raw === "object" && !Array.isArray(raw)) {
          setCompleted(
            Object.fromEntries(Object.entries(raw).filter(([, value]) => value === true)) as Record<
              string,
              boolean
            >,
          );
        }
      } catch {
        if (isGuest) setPlan(starterPlan());
        notify(
          "El almacenamiento del navegador no está disponible. Los cambios podrán perderse al salir.",
        );
      } finally {
        setReady(true);
      }
    }
    // The callback reads an external system, not derived React state.
    hydrateStorage();
  }, [isGuest, completionKey, notify]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const savePlan = useCallback(
    async (nextPlan: WeeklyPlan) => {
      const valid = weeklyPlanSchema.parse(nextPlan);
      if (isGuest) {
        try {
          localStorage.setItem(PLAN_KEY, JSON.stringify(valid));
        } catch {
          throw new Error(
            "No hay espacio para guardar. Libera almacenamiento o usa otro navegador.",
          );
        }
      } else {
        const response = await fetch("/api/routines", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(valid),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "No pudimos guardar el plan.");
      }
      setPlan(valid);
      notify(isGuest ? "Plan guardado en este navegador" : "Tu plan se guardó correctamente");
    },
    [isGuest, notify],
  );

  const toggleCompleted = useCallback(
    (key: string) => {
      const next = { ...completed, [key]: !completed[key] };
      // Bound local history; completion marks are a local convenience, separate from the plan.
      const compact = Object.fromEntries(
        Object.entries(next)
          .filter(([, value]) => value)
          .slice(-2000),
      );
      try {
        localStorage.setItem(completionKey, JSON.stringify(compact));
      } catch {
        notify("No se pudo guardar tu progreso en este navegador.");
        return;
      }
      setCompleted(compact);
    },
    [completed, completionKey, notify],
  );

  return (
    <PlannerContext.Provider
      value={{ user, isGuest, plan, ready, savePlan, completed, toggleCompleted, notice, notify }}
    >
      {children}
      {notice && (
        <div className="toast" role="status">
          <span className="toast-dot" />
          {notice}
        </div>
      )}
    </PlannerContext.Provider>
  );
}

export function usePlanner() {
  const context = useContext(PlannerContext);
  if (!context) throw new Error("PlannerProvider is required");
  return context;
}
