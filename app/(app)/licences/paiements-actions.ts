"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createPaiement(input: {
  licence_id: string;
  date_paiement_prevue: string;
  montant_prevu: number;
  notes?: string;
}) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("licences_paiements").insert({
    licence_id: input.licence_id,
    date_paiement_prevue: input.date_paiement_prevue,
    montant_prevu: input.montant_prevu,
    statut: "En attente",
    notes: input.notes ?? null,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/licences");
  revalidatePath("/alertes");
}

export async function marquerPaiementEffectue(input: {
  paiement_id: string;
  date_paiement_effectuee: string;
  montant_paye: number;
  mode_paiement?: string;
  reference_paiement?: string;
  notes?: string;
}) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("licences_paiements")
    .update({
      date_paiement_effectuee: input.date_paiement_effectuee,
      montant_paye: input.montant_paye,
      mode_paiement: input.mode_paiement ?? null,
      reference_paiement: input.reference_paiement ?? null,
      statut: "Payé",
      notes: input.notes ?? null,
    })
    .eq("id", input.paiement_id);

  if (error) throw new Error(error.message);

  revalidatePath("/licences");
  revalidatePath("/alertes");
}

export async function marquerPaiementEnRetard(paiement_id: string) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("licences_paiements")
    .update({ statut: "En retard" })
    .eq("id", paiement_id);

  if (error) throw new Error(error.message);

  revalidatePath("/licences");
  revalidatePath("/alertes");
}

export async function getPaiementsLicence(licence_id: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("licences_paiements")
    .select("*")
    .eq("licence_id", licence_id)
    .order("date_paiement_prevue", { ascending: false });

  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function deletePaiement(paiement_id: string) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("licences_paiements")
    .delete()
    .eq("id", paiement_id);

  if (error) throw new Error(error.message);

  revalidatePath("/licences");
  revalidatePath("/alertes");
}
