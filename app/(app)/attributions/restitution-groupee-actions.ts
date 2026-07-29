"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createRestitutionGroupee(params: {
  employe_id: string;
  date_restitution: string;
  commentaire?: string | null;
}) {
  const supabase = await createSupabaseServerClient();

  // Récupérer toutes les attributions actives de l'employé
  const { data: attributionsActives, error: fetchError } = await supabase
    .from("attributions")
    .select("id, numero_attribution")
    .eq("employe_id", params.employe_id)
    .eq("statut", "Actif");

  if (fetchError) {
    throw new Error("Erreur lors de la récupération des attributions");
  }

  if (!attributionsActives || attributionsActives.length === 0) {
    throw new Error("Aucun matériel actif à restituer pour cet employé");
  }

  // Mettre à jour toutes les attributions actives
  const updates = attributionsActives.map((attr) => ({
    id: attr.id,
    date_restitution: params.date_restitution,
    statut: "Restitué",
    commentaire: params.commentaire || null,
  }));

  const { error: updateError } = await supabase
    .from("attributions")
    .upsert(updates);

  if (updateError) {
    throw new Error("Erreur lors de la restitution groupée");
  }

  // Récupérer les IDs des matériels pour les libérer
  const { data: attributionsWithMateriel } = await supabase
    .from("attributions")
    .select("materiel_id")
    .in(
      "id",
      attributionsActives.map((a) => a.id)
    );

  // Mettre à jour le statut des matériels
  if (attributionsWithMateriel && attributionsWithMateriel.length > 0) {
    const materielIds = attributionsWithMateriel
      .map((a) => a.materiel_id)
      .filter(Boolean);

    if (materielIds.length > 0) {
      await supabase
        .from("materiels")
        .update({ statut: "Disponible" })
        .in("id", materielIds);
    }
  }

  revalidatePath("/attributions");
  revalidatePath("/employes");
  revalidatePath(`/employes/${params.employe_id}`);

  return {
    count: attributionsActives.length,
    numeros: attributionsActives.map((a) => a.numero_attribution).filter(Boolean),
  };
}
