import { Activity } from "lucide-react";
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand">
      <span className="brand-icon">
        <Activity size={23} strokeWidth={2.7} />
      </span>
      <span>
        PULSO<span className="brand-period">.</span>
        {!compact && <small>ROUTINE PLANNER</small>}
      </span>
    </span>
  );
}
