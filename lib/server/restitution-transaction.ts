import type { SupabaseClient } from "@supabase/supabase-js";

import { shouldUseAttributionDirectFallback } from "@/lib/server/create-attribution-transaction";

export async function restituerAttributionDirect(
  supabase: SupabaseClient,
  input: {
    attribution_id: string;
    materiel_id: string;
    date_restitution?: string;
    etat_restitution?: string | null;
    commentaire?: string | null;
  }
) {
  const updatePayload: {
    statut: string;
    date_restitution: string;
    etat_restitution?: string;
    commentaire?: string;
  } = {
    statut: "Restitué",
    date_restitution:
      input.date_restitution ?? new Date().toISOString().slice(0, 10),
  };

  if (input.etat_restitution) {
    updatePayload.etat_restitution = input.etat_restitution;
  }
  if (input.commentaire) {
    updatePayload.commentaire = input.commentaire;
  }

  const { error: attrError } = await supabase
    .from("attributions")
    .update(updatePayload)
    .eq("id", input.attribution_id)
    .eq("statut", "Actif");

  if (attrError) {
    throw new Error(attrError.message);
  }

  const { error: matError } = await supabase
    .from("materiels")
    .update({ statut: "Stock" })
    .eq("id", input.materiel_id);

  if (matError) {
    throw new Error(matError.message);
  }
}

export async function restituerAttributionWithFallback(
  supabase: SupabaseClient,
  input: {
    attribution_id: string;
    materiel_id: string;
    date_restitution?: string;
    etat_restitution?: string | null;
    commentaire?: string | null;
  }
) {
  const today = new Date().toISOString().slice(0, 10);
  const useDirect =
    Boolean(input.date_restitution && input.date_restitution !== today) ||
    Boolean(input.etat_restitution);

  if (useDirect) {
    await restituerAttributionDirect(supabase, input);
    return;
  }

  const { error: rpcError } = await supabase.rpc("restituer_attribution_transaction", {
    p_attribution_id: input.attribution_id,
    p_materiel_id: input.materiel_id,
    p_etat_restitution: input.etat_restitution || null,
    p_commentaire: input.commentaire || null,
  });

  if (!rpcError) {
    return;
  }

  if (shouldUseAttributionDirectFallback(rpcError.message)) {
    await restituerAttributionDirect(supabase, input);
    return;
  }

  throw new Error(rpcError.message);
}
