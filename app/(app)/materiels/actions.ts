"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  normalizeMaterielCode,
  normalizeMaterielType,
} from "@/lib/utils/materiel-taxonomy";

export async function createMateriel(input: {
  code_materiel: string;
  type: string;
  marque?: string | null;
  modele?: string | null;
  numero_serie?: string | null;
  site?: string | null;
  statut?: string | null;
  etat?: string | null;
  date_achat?: string | null;
  cout?: number | null;
  nom_device?: string | null;
  adresse_mac?: string | null;
  adresse_ip?: string | null;
  observations?: string | null;
  salle?: string | null;
  photo_url?: string | null;
  employe_id?: string | null;
  beneficiaire_type?: "employe" | "departement" | "societe" | null;
  beneficiaire_label?: string | null;
  date_attribution?: string | null;
}) {
  const supabase = await createSupabaseServerClient();

  const statut = input.statut ?? "Stock";
  const code_materiel = normalizeMaterielCode(input.code_materiel);
  const type = normalizeMaterielType(input.type);

  if (statut === "Attribué") {
    const bt = input.beneficiaire_type ?? "employe";
    if (bt === "employe" && !input.employe_id) {
      throw new Error("Veuillez sélectionner un employé.");
    }
    if (bt !== "employe" && !input.beneficiaire_label) {
      throw new Error("Veuillez renseigner le bénéficiaire (département/société).");
    }
  }

  const { data: materiel, error: insertError } = await supabase
    .from("materiels")
    .insert({
      code_materiel,
      type,
      marque: input.marque ?? null,
      modele: input.modele ?? null,
      numero_serie: input.numero_serie ?? null,
      site: input.site ?? null,
      statut,
      etat: input.etat ?? "Bon",
      date_achat: input.date_achat ?? null,
      cout: input.cout ?? null,
      nom_device: input.nom_device ?? null,
      adresse_mac: input.adresse_mac ?? null,
      adresse_ip: input.adresse_ip ?? null,
      observations: input.observations ?? null,
      salle: input.salle ?? null,
      photo_url: input.photo_url ?? null,
    })
    .select("id")
    .single();

  if (insertError) {
    // Gestion spécifique des erreurs de contrainte d'unicité
    if (insertError.code === "23505") {
      if (insertError.message.includes("unique_code_materiel")) {
        throw new Error(`Le code matériel "${input.code_materiel}" existe déjà. Veuillez choisir un code différent.`);
      }
      if (insertError.message.includes("unique_numero_serie")) {
        throw new Error(`Le numéro de série "${input.numero_serie}" existe déjà. Veuillez vérifier le numéro de série.`);
      }
    }
    throw new Error(insertError.message);
  }

  if (statut === "Attribué") {
    const date_attribution =
      input.date_attribution ?? new Date().toISOString().slice(0, 10);

    const beneficiaire_type = input.beneficiaire_type ?? "employe";

    const { error: attributionError } = await supabase.from("attributions").insert({
      materiel_id: materiel.id,
      employe_id: beneficiaire_type === "employe" ? input.employe_id! : null,
      date_attribution,
      statut: "Actif",
      beneficiaire_type,
      beneficiaire_label:
        beneficiaire_type === "employe" ? "Employé" : (input.beneficiaire_label ?? null),
    });

    if (attributionError) {
      throw new Error(attributionError.message);
    }
  }

  revalidatePath("/materiels");
  revalidatePath("/attributions");
  revalidatePath("/historique");
  revalidatePath("/dashboard");
}

export async function updateMateriel(input: {
  id: string;
  code_materiel: string;
  type: string;
  marque?: string | null;
  modele?: string | null;
  numero_serie?: string | null;
  site?: string | null;
  statut?: string | null;
  etat?: string | null;
  date_achat?: string | null;
  cout?: number | null;
  nom_device?: string | null;
  adresse_mac?: string | null;
  adresse_ip?: string | null;
  observations?: string | null;
  salle?: string | null;
  photo_url?: string | null;
  employe_id?: string | null;
  beneficiaire_type?: "employe" | "departement" | "societe" | null;
  beneficiaire_label?: string | null;
  date_attribution?: string | null;
}) {
  const supabase = await createSupabaseServerClient();

  const statut = input.statut ?? "Stock";

  if (statut === "Attribué") {
    const bt = input.beneficiaire_type ?? "employe";
    if (bt === "employe" && !input.employe_id) {
      throw new Error("Veuillez sélectionner un employé.");
    }
    if (bt !== "employe" && !input.beneficiaire_label) {
      throw new Error("Veuillez renseigner le bénéficiaire (département/société).");
    }
  }

  const { data: activeAttribution, error: activeAttrError } = await supabase
    .from("attributions")
    .select("id, statut")
    .eq("materiel_id", input.id)
    .eq("statut", "Actif")
    .maybeSingle<{ id: string; statut: string | null }>();

  if (activeAttrError) {
    throw new Error(activeAttrError.message);
  }

  // Always update material fields first.
  const { error: updateError } = await supabase
    .from("materiels")
    .update({
      code_materiel: normalizeMaterielCode(input.code_materiel),
      type: normalizeMaterielType(input.type),
      marque: input.marque ?? null,
      modele: input.modele ?? null,
      numero_serie: input.numero_serie ?? null,
      site: input.site ?? null,
      statut,
      etat: input.etat ?? "Bon",
      date_achat: input.date_achat ?? null,
      cout: input.cout ?? null,
      nom_device: input.nom_device ?? null,
      adresse_mac: input.adresse_mac ?? null,
      adresse_ip: input.adresse_ip ?? null,
      observations: input.observations ?? null,
      salle: input.salle ?? null,
      photo_url: input.photo_url ?? null,
    })
    .eq("id", input.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  // Keep attribution consistent with status.
  if (statut !== "Attribué") {
    if (activeAttribution) {
      const today = new Date().toISOString().slice(0, 10);
      const { error: closeError } = await supabase
        .from("attributions")
        .update({ statut: "Restitué", date_restitution: today })
        .eq("id", activeAttribution.id);

      if (closeError) {
        throw new Error(closeError.message);
      }
    }
  } else {
    const date_attribution = input.date_attribution ?? new Date().toISOString().slice(0, 10);
    const beneficiaire_type = input.beneficiaire_type ?? "employe";

    const attributionPayload = {
      employe_id: beneficiaire_type === "employe" ? input.employe_id! : null,
      date_attribution,
      beneficiaire_type,
      beneficiaire_label:
        beneficiaire_type === "employe" ? "Employé" : (input.beneficiaire_label ?? null),
    };

    if (activeAttribution) {
      const { error: updateAttrError2 } = await supabase
        .from("attributions")
        .update(attributionPayload)
        .eq("id", activeAttribution.id);

      if (updateAttrError2) {
        throw new Error(updateAttrError2.message);
      }
    } else {
      const { error: insertAttrError } = await supabase.from("attributions").insert({
        materiel_id: input.id,
        statut: "Actif",
        ...attributionPayload,
      });

      if (insertAttrError) {
        throw new Error(insertAttrError.message);
      }
    }
  }

  revalidatePath("/materiels");
  revalidatePath(`/materiels/${input.id}`);
  revalidatePath("/attributions");
  revalidatePath("/historique");
  revalidatePath("/dashboard");
}
