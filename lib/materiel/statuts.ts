export const MATERIEL_STATUTS = [
  "Stock",
  "Attribué",
  "Maintenance",
  "Transit",
  "Réformé",
  "Cédé",
  "Volé",
  "Perdu",
] as const;

export type MaterielStatut = (typeof MATERIEL_STATUTS)[number];

export const STATUTS_HORS_PARC: ReadonlySet<string> = new Set([
  "Réformé",
  "Cédé",
  "Volé",
  "Perdu",
]);

export const STATUTS_INDISPONIBLES: ReadonlySet<string> = new Set([
  "Maintenance",
  "Transit",
  "Hors service",
  ...STATUTS_HORS_PARC,
]);

export function isMaterielStatut(value: string | null | undefined): value is MaterielStatut {
  return MATERIEL_STATUTS.includes(value as MaterielStatut);
}

export function normalizeMaterielStatut(value: string | null | undefined): MaterielStatut {
  if (value === "Disponible") return "Stock";
  if (isMaterielStatut(value)) return value;
  return "Stock";
}

export const STATUT_BADGE_CLASS: Record<string, string> = {
  Stock: "bg-green-100 text-green-800 border-green-300 hover:bg-green-100",
  Attribué: "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100",
  Maintenance: "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100",
  Transit: "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-100",
  Réformé: "bg-stone-100 text-stone-800 border-stone-300 hover:bg-stone-100",
  Cédé: "bg-violet-100 text-violet-800 border-violet-300 hover:bg-violet-100",
  Volé: "bg-red-100 text-red-800 border-red-300 hover:bg-red-100",
  Perdu: "bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-100",
};

export const STATUT_DOT_CLASS: Record<string, string> = {
  Stock: "bg-green-500",
  Attribué: "bg-blue-500",
  Maintenance: "bg-yellow-500",
  Transit: "bg-gray-500",
  Réformé: "bg-stone-500",
  Cédé: "bg-violet-500",
  Volé: "bg-red-500",
  Perdu: "bg-orange-500",
};
