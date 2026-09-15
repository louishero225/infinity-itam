import { cn } from "@/lib/utils";

const statutStyles: Record<string, string> = {
  Ouvert: "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-800",
  "En cours":
    "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800",
  Résolu:
    "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800",
  Fermé: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

const prioriteStyles: Record<string, string> = {
  High: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-800",
  Medium:
    "bg-orange-50 text-orange-900 border-orange-200 dark:bg-orange-950/40 dark:text-orange-200 dark:border-orange-800",
  Normal:
    "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  "Non défini":
    "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
};

export function ItsmStatutBadge({ statut, className }: { statut: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide",
        statutStyles[statut] ?? statutStyles.Fermé,
        className
      )}
    >
      {statut}
    </span>
  );
}

export function ItsmPrioriteBadge({ priorite, className }: { priorite: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
        prioriteStyles[priorite] ?? prioriteStyles["Non défini"],
        className
      )}
    >
      {priorite}
    </span>
  );
}

export function ItsmSlaBadge({ enRetard }: { enRetard: boolean }) {
  if (!enRetard) {
    return (
      <span className="text-muted-foreground text-[11px] font-medium tabular-nums">OK</span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
      SLA dépassé
    </span>
  );
}

export function ticketRefLabel(ticket: { ticket_ref: string | null; id: string }) {
  if (ticket.ticket_ref) return ticket.ticket_ref;
  return `#${ticket.id.slice(0, 8).toUpperCase()}`;
}
