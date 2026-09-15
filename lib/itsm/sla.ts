/** Seuils SLA (jours) selon priorité — style Freshservice / JSM. */
export const SLA_DAYS_BY_PRIORITY: Record<string, number> = {
  High: 3,
  Medium: 7,
  Normal: 14,
  "Non défini": 30,
};

/** Seuil historique (exports / défaut). */
export const SLA_THRESHOLD_DAYS = 30;

export function slaDaysForPriority(priorite?: string | null) {
  if (!priorite) return SLA_THRESHOLD_DAYS;
  return SLA_DAYS_BY_PRIORITY[priorite] ?? SLA_THRESHOLD_DAYS;
}

export function parseDateTimeLocal(dateStr: string, timeStr: string) {
  const t = (timeStr || "").slice(0, 5);
  return new Date(`${dateStr}T${t}`);
}

export function toIsoOrNull(value: string | null | undefined) {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** Retard SLA auto selon priorité (saisie manuelle / portail). */
export function computeEnRetardSaisie(args: {
  date: string;
  heure_creation: string;
  resolved_at: string | null;
  priorite?: string | null;
}) {
  const createdAtLocal = parseDateTimeLocal(args.date, args.heure_creation);
  const ref = args.resolved_at ? new Date(args.resolved_at) : new Date();
  const days = slaDaysForPriority(args.priorite);
  const diffMs = ref.getTime() - createdAtLocal.getTime();
  return diffMs > days * 24 * 60 * 60 * 1000;
}

/** Anomalie de clôture groupée ManageEngine (> 30 jours). */
export function isResolutionAnomaly(args: {
  date: string;
  heure_creation: string;
  resolved_at: string | null;
}) {
  if (!args.resolved_at) return false;
  const createdAtLocal = parseDateTimeLocal(args.date, args.heure_creation);
  const resolved = new Date(args.resolved_at);
  const diffMs = resolved.getTime() - createdAtLocal.getTime();
  return diffMs > SLA_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
}

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function todayDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function nowTimeStr() {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export type SlaClockState = {
  open: boolean;
  breached: boolean;
  elapsedMs: number;
  remainingMs: number;
  progress: number;
  thresholdDays: number;
  label: string;
  detail: string;
};

function formatDurationShort(ms: number) {
  const abs = Math.abs(ms);
  const days = Math.floor(abs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((abs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days >= 1) return `${days} j${hours > 0 ? ` ${hours} h` : ""}`;
  if (hours >= 1) {
    const mins = Math.floor((abs % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours} h${mins > 0 ? ` ${mins} min` : ""}`;
  }
  const mins = Math.max(1, Math.floor(abs / (60 * 1000)));
  return `${mins} min`;
}

/** Chronomètre SLA (seuil selon priorité). */
export function getSlaClock(args: {
  date: string;
  heure_creation: string;
  resolved_at: string | null;
  statut?: string;
  priorite?: string | null;
  now?: Date;
}): SlaClockState {
  const now = args.now ?? new Date();
  const created = parseDateTimeLocal(args.date, args.heure_creation);
  const closed =
    args.statut === "Résolu" || args.statut === "Fermé"
      ? args.resolved_at
        ? new Date(args.resolved_at)
        : now
      : null;
  const end = closed ?? now;
  const thresholdDays = slaDaysForPriority(args.priorite);
  const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;
  const elapsedMs = Math.max(0, end.getTime() - created.getTime());
  const remainingMs = thresholdMs - elapsedMs;
  const breached = remainingMs < 0;
  const open = !closed;
  const progress = Math.min(1, elapsedMs / thresholdMs);

  if (!open) {
    return {
      open: false,
      breached,
      elapsedMs,
      remainingMs,
      progress,
      thresholdDays,
      label: breached ? `Clôturé · SLA +${formatDurationShort(remainingMs)}` : "Clôturé · SLA OK",
      detail: `Traité en ${formatDurationShort(elapsedMs)} (seuil ${thresholdDays} j · ${args.priorite || "Normal"})`,
    };
  }

  if (breached) {
    return {
      open: true,
      breached: true,
      elapsedMs,
      remainingMs,
      progress: 1,
      thresholdDays,
      label: `+${formatDurationShort(remainingMs)}`,
      detail: `SLA dépassé de ${formatDurationShort(remainingMs)} (seuil ${thresholdDays} j)`,
    };
  }

  return {
    open: true,
    breached: false,
    elapsedMs,
    remainingMs,
    progress,
    thresholdDays,
    label: formatDurationShort(remainingMs),
    detail: `${formatDurationShort(remainingMs)} restants · seuil ${thresholdDays} j (${args.priorite || "Normal"})`,
  };
}
