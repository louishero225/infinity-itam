import {
  employeDisplayName,
  normalizeEmployeText,
} from "@/lib/utils/employe-matching";

export type EmployeRef = {
  id: string;
  prenom: string;
  nom: string;
  departement?: string;
};

const MATCH_THRESHOLD = 0.75;

function tokens(value: string) {
  return [
    ...new Set(
      normalizeEmployeText(value)
        .split(" ")
        .filter((t) => t.length > 1)
    ),
  ];
}

function tokenOverlapScore(a: string, b: string) {
  const ta = new Set(tokens(a));
  const tb = new Set(tokens(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let common = 0;
  for (const t of ta) {
    if (tb.has(t)) common++;
  }
  return common / Math.min(ta.size, tb.size);
}

/** Rapproche un libellé demandeur (ticket) avec un employé ITAM. */
export function matchEmployeFromLabel(label: string, employes: EmployeRef[]) {
  const clean = label.trim();
  if (!clean) return null;

  const normalizedLabel = normalizeEmployeText(clean);
  let best: (EmployeRef & { score: number; canonical: string }) | null = null;

  for (const e of employes) {
    const canonical = employeDisplayName(e.prenom, e.nom);
    const variants = [
      canonical,
      `${e.nom} ${e.prenom}`,
      `${e.prenom} ${e.nom}`.toLowerCase(),
    ];

    for (const v of variants) {
      if (normalizeEmployeText(v) === normalizedLabel) {
        return { ...e, score: 1, canonical };
      }
    }

    const score = Math.max(
      tokenOverlapScore(clean, canonical),
      tokenOverlapScore(clean, `${e.nom} ${e.prenom}`)
    );

    if (!best || score > best.score) {
      best = { ...e, score, canonical };
    }
  }

  if (!best || best.score < MATCH_THRESHOLD) return null;
  return best;
}
