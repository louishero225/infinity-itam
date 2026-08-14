"use server";

import { revalidatePath } from "next/cache";
import { requireWrite } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createLicence(input: {
  nom: string;
  editeur?: string;
  type_licence?: "Perpétuelle" | "Abonnement" | "Volume" | "OEM" | "Autre";
  gestionnaire_id?: string;
  numero_licence?: string;
  cle_produit?: string;
  date_achat?: string;
  date_expiration?: string;
  cout?: number;
  nombre_postes?: number;
  postes_utilises?: number;
  materiel_id?: string;
  contact_support?: string;
  url_telechargement?: string;
  notes?: string;
  statut?: "Active" | "Expirée" | "En attente" | "Résiliée";
  is_active?: boolean;
}) {
  await requireWrite();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("licences").insert({
    nom: input.nom,
    editeur: input.editeur ?? null,
    type_licence: input.type_licence ?? null,
    gestionnaire_id: input.gestionnaire_id ?? null,
    numero_licence: input.numero_licence ?? null,
    cle_produit: input.cle_produit ?? null,
    date_achat: input.date_achat ?? null,
    date_expiration: input.date_expiration ?? null,
    cout: input.cout ?? null,
    nombre_postes: input.nombre_postes ?? 1,
    postes_utilises: input.postes_utilises ?? 0,
    materiel_id: input.materiel_id ?? null,
    contact_support: input.contact_support ?? null,
    url_telechargement: input.url_telechargement ?? null,
    notes: input.notes ?? null,
    statut: input.statut ?? "Active",
    is_active: input.is_active ?? true,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/licences");
  revalidatePath("/alertes");
}

export async function updateLicence(input: {
  id: string;
  nom: string;
  editeur?: string;
  type_licence?: "Perpétuelle" | "Abonnement" | "Volume" | "OEM" | "Autre";
  gestionnaire_id?: string;
  numero_licence?: string;
  cle_produit?: string;
  date_achat?: string;
  date_expiration?: string;
  cout?: number;
  nombre_postes?: number;
  postes_utilises?: number;
  materiel_id?: string;
  contact_support?: string;
  url_telechargement?: string;
  notes?: string;
  statut?: "Active" | "Expirée" | "En attente" | "Résiliée";
  is_active?: boolean;
}) {
  await requireWrite();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("licences")
    .update({
      nom: input.nom,
      editeur: input.editeur ?? null,
      type_licence: input.type_licence ?? null,
      gestionnaire_id: input.gestionnaire_id ?? null,
      numero_licence: input.numero_licence ?? null,
      cle_produit: input.cle_produit ?? null,
      date_achat: input.date_achat ?? null,
      date_expiration: input.date_expiration ?? null,
      cout: input.cout ?? null,
      nombre_postes: input.nombre_postes ?? 1,
      postes_utilises: input.postes_utilises ?? 0,
      materiel_id: input.materiel_id ?? null,
      contact_support: input.contact_support ?? null,
      url_telechargement: input.url_telechargement ?? null,
      notes: input.notes ?? null,
      statut: input.statut ?? "Active",
      is_active: input.is_active ?? true,
    })
    .eq("id", input.id);

  if (error) throw new Error(error.message);

  revalidatePath("/licences");
  revalidatePath("/alertes");
}

export async function deleteLicence(id: string) {
  await requireWrite();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("licences").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/licences");
  revalidatePath("/alertes");
}
