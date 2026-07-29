"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createReparation(input: {
  materiel_id: string;
  date_debut: string;
  date_fin?: string;
  type_intervention: "Maintenance préventive" | "Réparation" | "Mise à niveau" | "Diagnostic" | "Autre";
  description: string;
  cout?: number;
  prestataire?: string;
  numero_ticket?: string;
  statut?: "En attente" | "En cours" | "Terminée" | "Annulée";
  priorite?: "Basse" | "Normale" | "Haute" | "Urgente";
  pieces_changees?: string;
  diagnostique?: string;
  resolution?: string;
}) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("reparations").insert({
    materiel_id: input.materiel_id,
    date_debut: input.date_debut,
    date_fin: input.date_fin ?? null,
    type_intervention: input.type_intervention,
    description: input.description,
    cout: input.cout ?? null,
    prestataire: input.prestataire ?? null,
    numero_ticket: input.numero_ticket ?? null,
    statut: input.statut ?? "En cours",
    priorite: input.priorite ?? "Normale",
    pieces_changees: input.pieces_changees ?? null,
    diagnostique: input.diagnostique ?? null,
    resolution: input.resolution ?? null,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/reparations");
  revalidatePath(`/materiels/${input.materiel_id}`);
}

export async function updateReparation(input: {
  id: string;
  materiel_id: string;
  date_debut: string;
  date_fin?: string;
  type_intervention: "Maintenance préventive" | "Réparation" | "Mise à niveau" | "Diagnostic" | "Autre";
  description: string;
  cout?: number;
  prestataire?: string;
  numero_ticket?: string;
  statut?: "En attente" | "En cours" | "Terminée" | "Annulée";
  priorite?: "Basse" | "Normale" | "Haute" | "Urgente";
  pieces_changees?: string;
  diagnostique?: string;
  resolution?: string;
}) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("reparations")
    .update({
      materiel_id: input.materiel_id,
      date_debut: input.date_debut,
      date_fin: input.date_fin ?? null,
      type_intervention: input.type_intervention,
      description: input.description,
      cout: input.cout ?? null,
      prestataire: input.prestataire ?? null,
      numero_ticket: input.numero_ticket ?? null,
      statut: input.statut ?? "En cours",
      priorite: input.priorite ?? "Normale",
      pieces_changees: input.pieces_changees ?? null,
      diagnostique: input.diagnostique ?? null,
      resolution: input.resolution ?? null,
    })
    .eq("id", input.id);

  if (error) throw new Error(error.message);

  revalidatePath("/reparations");
  revalidatePath(`/materiels/${input.materiel_id}`);
}

export async function deleteReparation(id: string) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("reparations").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/reparations");
}
