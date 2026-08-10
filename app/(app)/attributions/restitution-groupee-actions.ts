"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { restituerAttributionWithFallback } from "@/lib/server/restitution-transaction";

export async function createRestitutionGroupee(params: {
  employe_id: string;
  date_restitution: string;
  commentaire?: string | null;
}) {
  const supabase = await createSupabaseServerClient();

  const { data: attributionsActives, error: fetchError } = await supabase
    .from("attributions")
    .select("id, numero_attribution, materiel_id")
    .eq("employe_id", params.employe_id)
    .eq("statut", "Actif");

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!attributionsActives || attributionsActives.length === 0) {
    throw new Error("Aucun matériel actif à restituer pour cet employé");
  }

  for (const attr of attributionsActives) {
    if (!attr.materiel_id) {
      throw new Error(`Attribution ${attr.numero_attribution ?? attr.id} sans matériel associé.`);
    }

    await restituerAttributionWithFallback(supabase, {
      attribution_id: attr.id,
      materiel_id: attr.materiel_id,
      date_restitution: params.date_restitution,
      commentaire: params.commentaire || null,
    });
  }

  revalidatePath("/attributions");
  revalidatePath("/employes");
  revalidatePath(`/employes/${params.employe_id}`);
  revalidatePath("/materiels");
  revalidatePath("/dashboard");
  revalidatePath("/destinataires");

  return {
    count: attributionsActives.length,
    numeros: attributionsActives.map((a) => a.numero_attribution).filter(Boolean),
    date_restitution: params.date_restitution,
  };
}
