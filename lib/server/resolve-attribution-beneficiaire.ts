import "server-only";

import { resolveEntiteId } from "@/app/(app)/entites/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BeneficiaireType } from "@/lib/utils/beneficiaire";

export type AttributionBeneficiaireInput = {
  beneficiaire_type: BeneficiaireType;
  employe_id?: string | null;
  entite_id?: string | null;
  beneficiaire_label?: string | null;
};

export type ResolvedAttributionBeneficiaire = {
  employe_id: string | null;
  entite_id: string | null;
  beneficiaire_type: BeneficiaireType;
  beneficiaire_label: string | null;
};

export function validateAttributionBeneficiaire(input: AttributionBeneficiaireInput) {
  const beneficiaire_type = input.beneficiaire_type ?? "employe";

  if (beneficiaire_type === "employe" && !input.employe_id) {
    throw new Error("Veuillez sélectionner un employé.");
  }

  if (
    beneficiaire_type !== "employe" &&
    !input.entite_id &&
    !input.beneficiaire_label
  ) {
    throw new Error(
      "Veuillez sélectionner ou renseigner le bénéficiaire (département/société)."
    );
  }

  return beneficiaire_type;
}

export async function resolveAttributionBeneficiaire(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  input: AttributionBeneficiaireInput
): Promise<ResolvedAttributionBeneficiaire> {
  const beneficiaire_type = validateAttributionBeneficiaire(input);

  if (beneficiaire_type === "employe") {
    return {
      employe_id: input.employe_id!,
      entite_id: null,
      beneficiaire_type,
      beneficiaire_label: "Employé",
    };
  }

  let entite_id = input.entite_id ?? null;
  let beneficiaire_label = input.beneficiaire_label ?? null;

  if (entite_id) {
    const { data: entite } = await supabase
      .from("entites")
      .select("nom")
      .eq("id", entite_id)
      .maybeSingle();
    if (entite?.nom) beneficiaire_label = entite.nom;
  } else if (beneficiaire_label) {
    entite_id = await resolveEntiteId(beneficiaire_label, beneficiaire_type);
  }

  return {
    employe_id: null,
    entite_id,
    beneficiaire_type,
    beneficiaire_label,
  };
}
