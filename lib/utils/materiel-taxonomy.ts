/** Nomenclature canonique matériel IAG */

export const MATERIEL_TYPES = [
  "Ordinateur Portable",
  "Ordinateur Fixe",
  "Smartphone",
  "Moniteur",
  "Tablet",
  "Imprimante",
  "Réseau",
  "Sécurité",
  "Batterie / Énergie",
  "Équipement AV / Studio",
  "Serveur",
  "Drone",
  "Stockage",
  "Poste VOIP",
] as const;

export type MaterielType = (typeof MATERIEL_TYPES)[number];

const TYPE_ALIASES: Record<string, MaterielType | string> = {
  telephone: "Smartphone",
  "telephone mobile": "Smartphone",
  smartphone: "Smartphone",
  "ordinateur portable": "Ordinateur Portable",
  "ordinateur fixe": "Ordinateur Fixe",
  pc: "Ordinateur Portable",
  ordinateur: "Ordinateur Portable",
  moniteur: "Moniteur",
  ecran: "Moniteur",
  imprimante: "Imprimante",
  tablette: "Tablet",
  tablet: "Tablet",
  reseau: "Réseau",
  securite: "Sécurité",
  "batterie / energie": "Batterie / Énergie",
  "batterie - energie": "Batterie / Énergie",
  "equipement av / studio": "Équipement AV / Studio",
  "equipement av - studio": "Équipement AV / Studio",
  serveur: "Serveur",
  drone: "Drone",
  stockage: "Stockage",
  voip: "Poste VOIP",
  "poste voip": "Poste VOIP",
};

/** Préfixes legacy → préfixe IAG canonique */
export const CODE_PREFIX_MAP: Record<string, string> = {
  PC: "IAG-PC",
  TEL: "IAG-TEL",
  MON: "IAG-MON",
  IMP: "IAG-IMP",
  PER: "IAG-PER",
  NET: "IAG-NET",
};

function stripAccents(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeKey(value: string) {
  return stripAccents(value).toLowerCase().replace(/\s+/g, " ").trim();
}

/** Unifie Téléphone → Smartphone et autres alias */
export function normalizeMaterielType(type: string | null | undefined): string {
  if (!type?.trim()) return "Autre";
  const key = normalizeKey(type);
  if (TYPE_ALIASES[key]) return TYPE_ALIASES[key];
  // Correspondance exacte insensible à la casse
  const exact = MATERIEL_TYPES.find((t) => normalizeKey(t) === key);
  return exact ?? type.trim();
}

/** PC-015 → IAG-PC-015, TEL-003 → IAG-TEL-003 */
export function normalizeMaterielCode(code: string | null | undefined): string {
  if (!code?.trim()) return "";
  const trimmed = code.trim().toUpperCase();
  if (trimmed.startsWith("IAG-")) return trimmed;

  const match = trimmed.match(/^(PC|TEL|MON|IMP|PER|NET)-(.+)$/);
  if (!match) return trimmed;

  const prefix = CODE_PREFIX_MAP[match[1]];
  return prefix ? `${prefix}-${match[2]}` : trimmed;
}

export const TYPE_CODE_PREFIX: Record<string, string> = {
  "Ordinateur Portable": "IAG-PC",
  "Ordinateur Fixe": "IAG-PC",
  Smartphone: "IAG-TEL",
  Moniteur: "IAG-MON",
  Imprimante: "IAG-IMP",
  Tablet: "IAG-TAB",
  Réseau: "IAG-NET",
  Sécurité: "IAG-SEC",
  "Batterie / Énergie": "IAG-BAT",
  "Équipement AV / Studio": "IAG-AV",
  Serveur: "IAG-SRV",
  Drone: "IAG-DRO",
  Stockage: "IAG-STO",
  "Poste VOIP": "IAG-VOIP",
};

export function codePrefixForType(type: string) {
  return TYPE_CODE_PREFIX[normalizeMaterielType(type)] ?? "IAG";
}

export function isLegacyCode(code: string | null | undefined): boolean {
  if (!code?.trim()) return false;
  const trimmed = code.trim().toUpperCase();
  return !trimmed.startsWith("IAG-") && /^(PC|TEL|MON|IMP|PER|NET)-/.test(trimmed);
}
