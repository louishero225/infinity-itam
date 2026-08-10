"use server";



import { revalidatePath } from "next/cache";



import { createSupabaseServerClient } from "@/lib/supabase/server";

import { resolveAttributionBeneficiaire } from "@/lib/server/resolve-attribution-beneficiaire";

import {

  assertMaterielAvailableForAttribution,

  createAttributionWithFallback,

} from "@/lib/server/create-attribution-transaction";

import { restituerAttributionWithFallback } from "@/lib/server/restitution-transaction";

import type { BeneficiaireType } from "@/lib/utils/beneficiaire";



export async function createAttribution(input: {

  materiel_id: string;

  employe_id?: string | null;

  entite_id?: string | null;

  beneficiaire_type: BeneficiaireType;

  beneficiaire_label?: string | null;

  date_attribution: string;

  commentaire?: string | null;

}) {

  const supabase = await createSupabaseServerClient();



  await assertMaterielAvailableForAttribution(supabase, input.materiel_id);



  const beneficiaire = await resolveAttributionBeneficiaire(supabase, {

    beneficiaire_type: input.beneficiaire_type ?? "employe",

    employe_id: input.employe_id,

    entite_id: input.entite_id,

    beneficiaire_label: input.beneficiaire_label,

  });



  const attributionId = await createAttributionWithFallback(supabase, {

    materiel_id: input.materiel_id,

    employe_id: beneficiaire.employe_id,

    entite_id: beneficiaire.entite_id,

    beneficiaire_type: beneficiaire.beneficiaire_type,

    beneficiaire_label: beneficiaire.beneficiaire_label,

    date_attribution: input.date_attribution,

    commentaire: input.commentaire ?? null,

  });



  revalidatePath("/attributions");

  revalidatePath("/materiels");

  revalidatePath("/dashboard");

  revalidatePath("/destinataires");



  return { attribution_id: attributionId };

}



export async function restituerAttribution(input: {

  attribution_id: string;

  materiel_id: string;

  etat_restitution?: string | null;

  commentaire?: string | null;

}) {

  const supabase = await createSupabaseServerClient();



  await restituerAttributionWithFallback(supabase, input);



  revalidatePath("/attributions");

  revalidatePath("/materiels");

  revalidatePath("/dashboard");

  revalidatePath("/destinataires");

}



export async function createOnboardingAttribution(input: {

  employe_id: string;

  materiel_ids: string[];

  date_attribution: string;

  commentaire?: string | null;

}) {

  const supabase = await createSupabaseServerClient();



  if (!input.employe_id) {

    throw new Error("Veuillez sélectionner un employé.");

  }



  if (!input.materiel_ids || input.materiel_ids.length === 0) {

    throw new Error("Veuillez sélectionner au moins un matériel.");

  }



  const attribution_ids: string[] = [];

  const numeros: string[] = [];



  for (const materiel_id of input.materiel_ids) {

    await assertMaterielAvailableForAttribution(supabase, materiel_id);



    const attributionId = await createAttributionWithFallback(supabase, {

      materiel_id,

      employe_id: input.employe_id,

      entite_id: null,

      beneficiaire_type: "employe",

      beneficiaire_label: "Employé",

      date_attribution: input.date_attribution,

      commentaire: input.commentaire ?? null,

    });



    attribution_ids.push(attributionId);



    const { data: attr } = await supabase

      .from("attributions")

      .select("numero_attribution")

      .eq("id", attributionId)

      .maybeSingle();



    if (attr?.numero_attribution) {

      numeros.push(attr.numero_attribution);

    }

  }



  revalidatePath("/attributions");

  revalidatePath("/materiels");

  revalidatePath("/dashboard");

  revalidatePath("/employes");

  revalidatePath("/destinataires");



  return {

    attribution_ids,

    numeros,

    count: attribution_ids.length,

  };

}

