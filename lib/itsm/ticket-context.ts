export type MaterielActifRef = {
  code_materiel: string;
  type: string;
};

/** Choisit l'employé lié au ticket (FK d'abord, puis match nom). */
export function pickDemandeurEmployeId(input: {
  ticketEmployeId: string | null | undefined;
  matchedEmployeId: string | null | undefined;
}): string | null {
  const fromTicket = input.ticketEmployeId?.trim();
  if (fromTicket) return fromTicket;
  const fromMatch = input.matchedEmployeId?.trim();
  if (fromMatch) return fromMatch;
  return null;
}

/** Résumé lisible du parc attribué au demandeur. */
export function summarizeParcDemandeur(materiels: MaterielActifRef[]) {
  const codes = materiels.map((m) => m.code_materiel).filter(Boolean);
  const count = codes.length;
  return {
    count,
    codes,
    label:
      count === 0
        ? "Aucun matériel attribué"
        : count === 1
          ? "1 matériel attribué"
          : `${count} matériels attribués`,
  };
}
