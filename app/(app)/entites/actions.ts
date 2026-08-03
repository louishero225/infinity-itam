"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { entiteCodeFromNom, type BeneficiaireType } from "@/lib/utils/beneficiaire";

export type EntiteRow = {
  id: string;
  code: string;
  nom: string;
  type: BeneficiaireType;
  actif: boolean;
};

export async function getEntites(type?: BeneficiaireType) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("entites")
    .select("id, code, nom, type, actif")
    .eq("actif", true)
    .order("nom");

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as EntiteRow[];
}

export async function createEntite(input: {
  nom: string;
  type: BeneficiaireType;
  code?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const code = (input.code?.trim() || entiteCodeFromNom(input.nom)).toUpperCase();

  const { data, error } = await supabase
    .from("entites")
    .insert({
      code,
      nom: input.nom.trim(),
      type: input.type,
      actif: true,
    })
    .select("id, code, nom, type, actif")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(`L'entité avec le code "${code}" existe déjà.`);
    }
    throw new Error(error.message);
  }

  revalidatePath("/destinataires");
  revalidatePath("/attributions");
  return data as EntiteRow;
}

/** Trouve ou crée une entité à partir d'un libellé (import / saisie) */
export async function resolveEntiteId(
  nom: string,
  type: BeneficiaireType = "departement"
): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const trimmed = nom.trim();
  const code = entiteCodeFromNom(trimmed);

  const { data: existing } = await supabase
    .from("entites")
    .select("id")
    .or(`code.eq.${code},nom.ilike.${trimmed}`)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data, error } = await supabase
    .from("entites")
    .insert({ code, nom: trimmed, type, actif: true })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: retry } = await supabase
        .from("entites")
        .select("id")
        .eq("code", code)
        .single();
      if (retry?.id) return retry.id;
    }
    throw new Error(error.message);
  }

  return data!.id;
}

export async function getEntitesWithMaterielCount() {
  const supabase = await createSupabaseServerClient();

  const [{ data: entites }, { data: attributions }] = await Promise.all([
    supabase.from("entites").select("*").eq("actif", true).order("nom"),
    supabase
      .from("attributions")
      .select("id, entite_id, materiel_id")
      .eq("statut", "Actif")
      .not("entite_id", "is", null),
  ]);

  const counts = new Map<string, number>();
  for (const a of attributions ?? []) {
    if (a.entite_id) {
      counts.set(a.entite_id, (counts.get(a.entite_id) ?? 0) + 1);
    }
  }

  return (entites ?? []).map((e) => ({
    ...e,
    materiel_actif: counts.get(e.id) ?? 0,
  }));
}
