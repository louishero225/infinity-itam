export const FLOTTE_STATUTS = ["attribue", "disponible", "reserve", "desactive", "en_commande"] as const;
export type FlotteStatut = (typeof FLOTTE_STATUTS)[number];

export const FLOTTE_STATUT_LABELS: Record<FlotteStatut, string> = {
  attribue: "Attribué",
  disponible: "Disponible",
  reserve: "Réservé",
  desactive: "Désactivé",
  en_commande: "En commande",
};

export const DEMANDE_ORANGE_STATUTS = [
  "brouillon",
  "soumise",
  "en_cours",
  "livree",
  "annulee",
] as const;
export type DemandeOrangeStatut = (typeof DEMANDE_ORANGE_STATUTS)[number];

export const DEMANDE_ORANGE_LABELS: Record<DemandeOrangeStatut, string> = {
  brouillon: "Brouillon",
  soumise: "Soumise à Orange",
  en_cours: "En cours Orange",
  livree: "Livrée",
  annulee: "Annulée",
};

/** Forfaits Orange Mix Hybrid — montants mensuels */
export const FLOTTE_FORMULES = ["mix_3", "mix_5"] as const;
export type FlotteFormule = (typeof FLOTTE_FORMULES)[number];

export const FLOTTE_FORMULE_LABELS: Record<FlotteFormule, string> = {
  mix_3: "MIX 3",
  mix_5: "MIX 5",
};

/** Montants TTC alloués (référence métier) et HT facture Orange déc. 2025 */
export const FLOTTE_FORFAITS: Record<
  FlotteFormule,
  { montant_ttc: number; montant_ht: number; label: string }
> = {
  mix_3: { montant_ttc: 2500, montant_ht: 2119, label: "MIX 3" },
  mix_5: { montant_ttc: 5000, montant_ht: 4237, label: "MIX 5" },
};

export function forfaitFromFormule(formule: string | null | undefined) {
  if (formule === "mix_3" || formule === "mix_5") return FLOTTE_FORFAITS[formule];
  return null;
}
