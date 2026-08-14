"use server";

import { revalidatePath } from "next/cache";
import { requireWrite } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function traiterAlerte(alerteId: string) {
  await requireWrite();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("alertes")
    .update({
      statut: "traitee",
      traitee_le: new Date().toISOString(),
    })
    .eq("id", alerteId);

  if (error) throw new Error(error.message);

  revalidatePath("/alertes");
  revalidatePath("/dashboard");
}

export async function ignorerAlerte(alerteId: string) {
  await requireWrite();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("alertes")
    .update({
      statut: "ignoree",
      traitee_le: new Date().toISOString(),
    })
    .eq("id", alerteId);

  if (error) throw new Error(error.message);

  revalidatePath("/alertes");
  revalidatePath("/dashboard");
}

export async function createAlerte(input: {
  type: "maintenance" | "garantie" | "renouvellement" | "reparation" | "autre";
  titre: string;
  description?: string;
  priorite: "basse" | "normale" | "haute" | "critique";
  date_echeance?: string;
  materiel_id?: string;
  licence_id?: string;
}) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("alertes").insert({
    type: input.type,
    titre: input.titre,
    description: input.description ?? null,
    priorite: input.priorite,
    date_echeance: input.date_echeance ?? null,
    materiel_id: input.materiel_id ?? null,
    licence_id: input.licence_id ?? null,
    statut: "active",
  });

  if (error) throw new Error(error.message);

  revalidatePath("/alertes");
  revalidatePath("/dashboard");
}
