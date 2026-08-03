export type BeneficiaireType = "employe" | "departement" | "societe" | "site";

export type EntiteMini = {
  id: string;
  code: string;
  nom: string;
  type: BeneficiaireType;
};

export type EmployeMini = {
  id: string;
  prenom: string;
  nom: string;
  departement: string;
};

export type BeneficiaireInfo = {
  type: BeneficiaireType | "stock" | "inconnu";
  label: string;
  sublabel?: string;
  employe?: EmployeMini | null;
  entite?: EntiteMini | null;
};

const GENERIC_ACCOUNTS = new Set([
  "support it",
  "it",
  "comptabilite",
  "compta",
  "rh",
  "ressources humaines",
  "direction",
  "iag",
  "iat",
  "iap",
  "iac",
  "iaf",
]);

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Génère un code entité stable à partir d'un libellé */
export function entiteCodeFromNom(nom: string): string {
  const n = nom.trim();
  const upper = n.toUpperCase();
  if (/^[A-Z0-9-]{2,12}$/.test(upper.replace(/\s/g, ""))) {
    return upper.replace(/\s/g, "").slice(0, 20);
  }
  const key = normalizeKey(n)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 24);
  return key.toUpperCase() || "ENTITE";
}

/** Détecte si un libellé Excel ressemble à un compte générique / entité plutôt qu'une personne */
export function isGenericDestinataire(name: string | null | undefined): boolean {
  if (!name?.trim()) return false;
  const key = normalizeKey(name);
  if (GENERIC_ACCOUNTS.has(key)) return true;
  if (key.includes("infinity africa")) return true;
  if (key.includes("support")) return true;
  const tokens = key.split(/\s+/).filter(Boolean);
  if (tokens.length === 1 && tokens[0].length <= 4) return true;
  return false;
}

/** Classifie une ligne inventaire Excel en destinataire employé ou entité */
export function classifyExcelDestinataire(
  utilisateur: string | null | undefined,
  departement: string | null | undefined
): {
  beneficiaire_type: BeneficiaireType;
  employeName?: string;
  entiteNom?: string;
  entiteType: BeneficiaireType;
} | null {
  const user = utilisateur?.trim() || "";
  const dept = departement?.trim() || "";

  if (user && !isGenericDestinataire(user)) {
    return {
      beneficiaire_type: "employe",
      employeName: user,
      entiteType: "departement",
    };
  }

  const entiteNom = dept || user;
  if (!entiteNom) return null;

  const entiteType: BeneficiaireType =
    normalizeKey(entiteNom).includes("infinity") || normalizeKey(entiteNom) === "iag"
      ? "societe"
      : "departement";

  return {
    beneficiaire_type: entiteType === "societe" ? "societe" : "departement",
    entiteNom,
    entiteType,
  };
}

export function resolveBeneficiaire(input: {
  beneficiaire_type?: string | null;
  beneficiaire_label?: string | null;
  employe?: EmployeMini | null;
  entite?: EntiteMini | null;
}): BeneficiaireInfo {
  if (input.employe) {
    return {
      type: "employe",
      label: `${input.employe.prenom} ${input.employe.nom}`.trim(),
      sublabel: input.employe.departement,
      employe: input.employe,
    };
  }

  if (input.entite) {
    return {
      type: input.entite.type,
      label: input.entite.nom,
      sublabel: input.entite.code,
      entite: input.entite,
    };
  }

  const bt = (input.beneficiaire_type ?? "departement") as BeneficiaireType;
  const label = input.beneficiaire_label?.trim();
  if (label) {
    return {
      type: bt,
      label,
      sublabel: bt === "societe" ? "Société" : "Département / entité",
    };
  }

  return { type: "inconnu", label: "—" };
}

export const BENEFICIAIRE_TYPE_LABELS: Record<BeneficiaireType, string> = {
  employe: "Employé",
  departement: "Département",
  societe: "Société",
  site: "Site",
};
