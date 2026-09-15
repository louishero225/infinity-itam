"use client";

import * as React from "react";

import { getSlaClock, type SlaClockState } from "@/lib/itsm/sla";
import { cn } from "@/lib/utils";

type Props = {
  date: string;
  heure_creation: string;
  resolved_at: string | null;
  statut?: string;
  priorite?: string | null;
  compact?: boolean;
  className?: string;
};

function tone(state: SlaClockState) {
  if (!state.open) {
    return state.breached
      ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
      : "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200";
  }
  if (state.breached) {
    return "border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200";
  }
  if (state.progress >= 0.75) {
    return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200";
  }
  return "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-200";
}

export function ItsmSlaClock({
  date,
  heure_creation,
  resolved_at,
  statut,
  priorite,
  compact,
  className,
}: Props) {
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    const open = statut !== "Résolu" && statut !== "Fermé";
    if (!open) return;
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, [statut]);

  const state = getSlaClock({ date, heure_creation, resolved_at, statut, priorite, now });

  if (compact) {
    return (
      <span
        title={state.detail}
        className={cn(
          "inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums",
          tone(state),
          className
        )}
      >
        {state.open ? `SLA ${state.label}` : state.label}
      </span>
    );
  }

  return (
    <div className={cn("rounded-xl border px-3 py-2.5", tone(state), className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold tracking-wider uppercase opacity-80">
          SLA · {state.thresholdDays} j
        </p>
        <p className="font-mono text-sm font-semibold tabular-nums">{state.label}</p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            state.breached ? "bg-red-600 dark:bg-red-400" : "bg-current opacity-70"
          )}
          style={{ width: `${Math.round(state.progress * 100)}%` }}
        />
      </div>
      <p className="mt-1.5 text-[11px] leading-snug opacity-90">{state.detail}</p>
    </div>
  );
}
