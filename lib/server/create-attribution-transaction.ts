import type { SupabaseClient } from "@supabase/supabase-js";

/** Bascule en mode direct si la RPC est absente ou mal configurée en base */
export function shouldUseAttributionDirectFallback(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("could not find the function") ||
    normalized.includes("schema cache") ||
    normalized.includes("does not exist") ||
    normalized.includes("42883")
  );
}

/** @deprecated Utiliser shouldUseAttributionDirectFallback */
export function isMissingAttributionRpc(message: string) {
  return shouldUseAttributionDirectFallback(message);
}

async function generateNumeroAttribution(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase.rpc("generate_numero_attribution");
  if (!error && typeof data === "string" && data.length > 0) {
    return data;
  }

  const year = new Date().getFullYear().toString();
  const { data: rows, error: fetchError } = await supabase
    .from("attributions")
    .select("numero_attribution")
    .like("numero_attribution", `ATR-${year}-%`);

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  let maxNumber = 0;
  for (const row of rows ?? []) {
    const match = row.numero_attribution?.match(new RegExp(`^ATR-${year}-(\\d+)$`));
    if (match) {
      maxNumber = Math.max(maxNumber, Number.parseInt(match[1], 10));
    }
  }

  return `ATR-${year}-${String(maxNumber + 1).padStart(3, "0")}`;
}

export async function assertMaterielAvailableForAttribution(
  supabase: SupabaseClient,
  materielId: string
) {
  const { data: materiel, error: materielError } = await supabase
    .from("materiels")
    .select("id, statut, code_materiel")
    .eq("id", materielId)
    .maybeSingle();

  if (materielError) {
    throw new Error(materielError.message);
  }

  if (!materiel) {
    throw new Error("Matériel introuvable.");
  }

  const { data: activeAttribution, error: attrError } = await supabase
    .from("attributions")
    .select("id")
    .eq("materiel_id", materielId)
    .eq("statut", "Actif")
    .maybeSingle();

  if (attrError) {
    throw new Error(attrError.message);
  }

  if (activeAttribution) {
    throw new Error(
      `Le matériel ${materiel.code_materiel ?? materielId} a déjà une attribution active.`
    );
  }

  const unavailableStatuts = new Set(["Maintenance", "Transit", "Hors service"]);
  if (materiel.statut && unavailableStatuts.has(materiel.statut)) {
    throw new Error(
      `Le matériel ${materiel.code_materiel ?? materielId} n'est pas disponible (statut : ${materiel.statut}).`
    );
  }
}

export async function createAttributionDirect(
  supabase: SupabaseClient,
  input: {
    materiel_id: string;
    employe_id: string | null;
    entite_id: string | null;
    beneficiaire_type: string;
    beneficiaire_label: string | null;
    date_attribution: string;
    commentaire?: string | null;
  }
): Promise<string> {
  await assertMaterielAvailableForAttribution(supabase, input.materiel_id);

  const numero = await generateNumeroAttribution(supabase);

  const { data, error } = await supabase
    .from("attributions")
    .insert({
      materiel_id: input.materiel_id,
      employe_id: input.employe_id,
      entite_id: input.entite_id,
      date_attribution: input.date_attribution,
      statut: "Actif",
      numero_attribution: numero,
      beneficiaire_type: input.beneficiaire_type,
      beneficiaire_label: input.beneficiaire_label,
      commentaire: input.commentaire ?? null,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const { error: matError } = await supabase
    .from("materiels")
    .update({ statut: "Attribué" })
    .eq("id", input.materiel_id);

  if (matError) {
    throw new Error(matError.message);
  }

  return data.id;
}

export async function createAttributionWithFallback(
  supabase: SupabaseClient,
  input: {
    materiel_id: string;
    employe_id: string | null;
    entite_id: string | null;
    beneficiaire_type: string;
    beneficiaire_label: string | null;
    date_attribution: string;
    commentaire?: string | null;
  }
): Promise<string> {
  await assertMaterielAvailableForAttribution(supabase, input.materiel_id);

  const { data: attributionId, error: rpcError } = await supabase.rpc(
    "create_attribution_transaction",
    {
      p_materiel_id: input.materiel_id,
      p_employe_id: input.employe_id,
      p_entite_id: input.entite_id,
      p_beneficiaire_type: input.beneficiaire_type,
      p_beneficiaire_label: input.beneficiaire_label,
      p_date_attribution: input.date_attribution,
      p_commentaire: input.commentaire ?? null,
    }
  );

  if (!rpcError && attributionId) {
    return attributionId as string;
  }

  if (rpcError && shouldUseAttributionDirectFallback(rpcError.message)) {
    return createAttributionDirect(supabase, input);
  }

  throw new Error(rpcError?.message ?? "Erreur lors de la création de l'attribution");
}
