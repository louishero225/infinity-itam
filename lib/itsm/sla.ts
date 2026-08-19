export const SLA_THRESHOLD_DAYS = 30;

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

/** Retard SLA auto (30 jours) pour tickets saisis manuellement. */
export function computeEnRetardSaisie(args: {
  date: string;
  heure_creation: string;
  resolved_at: string | null;
}) {
  const createdAtLocal = parseDateTimeLocal(args.date, args.heure_creation);
  const ref = args.resolved_at ? new Date(args.resolved_at) : new Date();
  const diffMs = ref.getTime() - createdAtLocal.getTime();
  return diffMs > SLA_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
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
