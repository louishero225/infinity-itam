"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin, requireWrite } from "@/lib/auth/roles";
import { logAudit } from "@/lib/server/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  employeDisplayName,
  findDuplicateEmployeGroups,
} from "@/lib/utils/employe-matching";

export async function getEmployes() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("employes")
    .select("id, prenom, nom, departement, email")
    .eq("statut", "Actif")
    .order("nom", { ascending: true });

  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function createEmploye(input: {
  prenom: string;
  nom: string;
  departement: string;
  service?: string | null;
  fonction?: string | null;
  site?: string | null;
  matricule?: string | null;
  email?: string | null;
  statut?: string | null;
}) {
  await requireWrite();
  const supabase = await createSupabaseServerClient();

  const email = input.email?.trim().toLowerCase() || null;

  const { error } = await supabase.from("employes").insert({
    prenom: input.prenom,
    nom: input.nom,
    departement: input.departement,
    service: input.service ?? null,
    fonction: input.fonction ?? null,
    site: input.site ?? null,
    matricule: input.matricule ?? null,
    email,
    statut: input.statut ?? "Actif",
  });

  if (error) {
    if (error.code === "23505" && error.message.includes("unique_matricule")) {
      throw new Error(
        `Le matricule "${input.matricule}" existe déjà. Veuillez choisir un matricule différent.`
      );
    }
    if (error.code === "23505" && error.message.toLowerCase().includes("email")) {
      throw new Error(`L'email "${email}" est déjà associé à un autre collaborateur.`);
    }
    throw new Error(error.message);
  }

  await logAudit({
    action: "create_employe",
    entityType: "employe",
    details: { nom: `${input.prenom} ${input.nom}`, email },
  });

  revalidatePath("/employes");
}

/** Associe / met à jour l'email Microsoft d'un collaborateur (clé du portail Mes demandes). */
export async function updateEmployeEmail(employeId: string, email: string | null) {
  await requireWrite();
  const supabase = await createSupabaseServerClient();
  const clean = email?.trim().toLowerCase() || null;

  const { error } = await supabase.from("employes").update({ email: clean }).eq("id", employeId);
  if (error) {
    if (error.code === "23505") {
      throw new Error("Cet email est déjà utilisé par un autre collaborateur.");
    }
    throw new Error(error.message);
  }

  await logAudit({
    action: "employe.update_email",
    entityType: "employe",
    entityId: employeId,
    details: { email: clean },
  });

  revalidatePath("/employes");
  revalidatePath(`/employes/${employeId}`);
  revalidatePath("/mes-demandes");
}

export async function mergeEmployes(sourceId: string, targetId: string) {
  await requireAdmin();
  if (sourceId === targetId) {
    throw new Error("Impossible de fusionner un employé avec lui-même.");
  }

  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: source }, { data: target }] = await Promise.all([
    supabase.from("employes").select("id, prenom, nom").eq("id", sourceId).single(),
    supabase.from("employes").select("id, prenom, nom").eq("id", targetId).single(),
  ]);

  if (!source || !target) {
    throw new Error("Employé source ou cible introuvable.");
  }

  const { data: sourceAttrs, error: attrError } = await supabase
    .from("attributions")
    .select("id, materiel_id, statut")
    .eq("employe_id", sourceId);

  if (attrError) throw new Error(attrError.message);

  for (const attr of sourceAttrs ?? []) {
    if (attr.statut === "Actif") {
      const { data: conflict } = await supabase
        .from("attributions")
        .select("id")
        .eq("employe_id", targetId)
        .eq("materiel_id", attr.materiel_id)
        .eq("statut", "Actif")
        .maybeSingle();

      if (conflict) {
        const { error } = await supabase
          .from("attributions")
          .update({
            statut: "Restitué",
            date_restitution: today,
            commentaire: `Fusion vers ${employeDisplayName(target.prenom, target.nom)}`,
          })
          .eq("id", attr.id);
        if (error) throw new Error(error.message);

        if (attr.materiel_id) {
          const { error: materielError } = await supabase
            .from("materiels")
            .update({ statut: "Stock" })
            .eq("id", attr.materiel_id);
          if (materielError) throw new Error(materielError.message);
        }
        continue;
      }
    }

    const { error } = await supabase
      .from("attributions")
      .update({ employe_id: targetId })
      .eq("id", attr.id);
    if (error) throw new Error(error.message);
  }

  const { error: deleteError } = await supabase.from("employes").delete().eq("id", sourceId);
  if (deleteError) throw new Error(deleteError.message);

  await logAudit({
    action: "merge_employes",
    entityType: "employe",
    entityId: targetId,
    details: { sourceId },
  });

  revalidatePath("/employes");
  revalidatePath("/attributions");
  revalidatePath("/materiels");
  revalidatePath("/dashboard");
  revalidatePath("/administration");

  return {
    merged: employeDisplayName(source.prenom, source.nom),
    into: employeDisplayName(target.prenom, target.nom),
  };
}

export async function getDuplicateEmployeGroups() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("employes")
    .select("id, prenom, nom, departement")
    .eq("statut", "Actif")
    .order("nom");

  if (error) throw new Error(error.message);
  return findDuplicateEmployeGroups(data ?? []);
}
