"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createAttribution(input: {
  materiel_id: string;
  employe_id?: string | null;
  beneficiaire_type: "employe" | "departement" | "societe";
  beneficiaire_label?: string | null;
  date_attribution: string;
  commentaire?: string | null;
}) {
  const supabase = await createSupabaseServerClient();

  const beneficiaire_type = input.beneficiaire_type ?? "employe";

  if (beneficiaire_type === "employe" && !input.employe_id) {
    throw new Error("Veuillez sélectionner un employé.");
  }

  if (beneficiaire_type !== "employe" && !input.beneficiaire_label) {
    throw new Error("Veuillez renseigner le bénéficiaire (département/société).");
  }

  // Générer le numéro d'attribution
  const { data: numeroData, error: numeroError } = await supabase.rpc("generate_numero_attribution");
  
  if (numeroError) {
    console.error("Erreur génération numéro:", numeroError);
  }

  const { data: attribution, error: insertError } = await supabase.from("attributions").insert({
    materiel_id: input.materiel_id,
    employe_id: beneficiaire_type === "employe" ? input.employe_id! : null,
    date_attribution: input.date_attribution,
    statut: "Actif",
    numero_attribution: numeroData || undefined,
    beneficiaire_type,
    beneficiaire_label:
      beneficiaire_type === "employe"
        ? "Employé"
        : (input.beneficiaire_label ?? null),
    commentaire: input.commentaire ?? null,
  }).select("id").single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  const { error: updateError } = await supabase
    .from("materiels")
    .update({ statut: "Attribué" })
    .eq("id", input.materiel_id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/attributions");
  revalidatePath("/materiels");
  revalidatePath("/dashboard");
  
  return { attribution_id: attribution?.id };
}

export async function restituerAttribution(input: {
  attribution_id: string;
  materiel_id: string;
  etat_restitution?: string | null;
  commentaire?: string | null;
}) {
  const supabase = await createSupabaseServerClient();

  const { error: updateAttrError } = await supabase
    .from("attributions")
    .update({
      statut: "Restitué",
      date_restitution: new Date().toISOString().slice(0, 10),
      etat_restitution: input.etat_restitution || null,
      commentaire: input.commentaire || null,
    })
    .eq("id", input.attribution_id);

  if (updateAttrError) {
    throw new Error(updateAttrError.message);
  }

  const { error: updateMatError } = await supabase
    .from("materiels")
    .update({ statut: "Stock" })
    .eq("id", input.materiel_id);

  if (updateMatError) {
    throw new Error(updateMatError.message);
  }

  revalidatePath("/attributions");
  revalidatePath("/materiels");
  revalidatePath("/dashboard");
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

  // Créer une attribution pour chaque matériel
  for (const materiel_id of input.materiel_ids) {
    // Générer le numéro d'attribution
    const { data: numeroData, error: numeroError } = await supabase.rpc("generate_numero_attribution");
    
    if (numeroError) {
      console.error("Erreur génération numéro:", numeroError);
    }

    const numero = numeroData || `ATR-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9)}`;
    numeros.push(numero);

    // Insérer l'attribution
    const { data: attribution, error: insertError } = await supabase
      .from("attributions")
      .insert({
        materiel_id,
        employe_id: input.employe_id,
        date_attribution: input.date_attribution,
        statut: "Actif",
        numero_attribution: numero,
        beneficiaire_type: "employe",
        beneficiaire_label: "Employé",
        commentaire: input.commentaire ?? null,
      })
      .select("id")
      .single();

    if (insertError) {
      throw new Error(`Erreur lors de l'attribution: ${insertError.message}`);
    }

    if (attribution?.id) {
      attribution_ids.push(attribution.id);
    }

    // Mettre à jour le statut du matériel
    const { error: updateError } = await supabase
      .from("materiels")
      .update({ statut: "Attribué" })
      .eq("id", materiel_id);

    if (updateError) {
      throw new Error(`Erreur mise à jour matériel: ${updateError.message}`);
    }
  }

  revalidatePath("/attributions");
  revalidatePath("/materiels");
  revalidatePath("/dashboard");
  revalidatePath("/employes");

  return { 
    attribution_ids,
    numeros,
    count: attribution_ids.length 
  };
}
