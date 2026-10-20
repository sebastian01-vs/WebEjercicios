import { plannerSession } from "@/lib/auth";
import { readPlan } from "@/lib/plan-store";
import { PlannerProvider } from "@/components/planner-provider";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function PlannerLayout({ children }: { children: React.ReactNode }) {
  const { user, isGuest } = await plannerSession();
  const initialPlan = user ? await readPlan(user.id) : null;
  return (
    <PlannerProvider user={user} isGuest={isGuest} initialPlan={initialPlan}>
      <AppShell>{children}</AppShell>
    </PlannerProvider>
  );
}
