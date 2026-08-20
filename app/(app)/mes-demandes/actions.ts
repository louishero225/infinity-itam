"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAccess, requireTicketRequest } from "@/lib/auth/roles";
import { logAudit } from "@/lib/server/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_TECHNICIAN, ITSM_CATEGORIES, ITSM_ENTITES } from "@/lib/itsm/constants";
import { computeEnRetardSaisie, nowTimeStr, todayDateStr } from "@/lib/itsm/sla";
import { employeDisplayName } from "@/lib/utils/employe-matching";
import type { IitsmTicket } from "@/app/(app)/itsm/actions";

export type CollaborateurProfil = {
  id: string;
  prenom: string;
  nom: string;
  departement: string;
  site: string | null;
  email: string | null;
} | null;

/**
 * Lie le compte connecté (souvent Microsoft) à la fiche employé
 * via l'email professionnel renseigné sur l'employé.
 */
export async function resolveCollaborateurProfil(): Promise<{
  access: Awaited<ReturnType<typeof getAccess>>;
  employe: CollaborateurProfil;
}> {
  const access = await getAccess();
  const supabase = await createSupabaseServerClient();
  const email = access.email?.trim().toLowerCase() ?? "";

  let employe: CollaborateurProfil = null;

  if (email) {
    const { data } = await supabase
      .from("employes")
      .select("id, prenom, nom, departement, site, email")
      .ilike("email", email)
      .maybeSingle();
    if (data) {
      employe = {
        id: data.id,
        prenom: data.prenom,
        nom: data.nom,
        departement: data.departement,
        site: data.site,
        email: data.email,
      };
    }
  }

  return { access, employe };
}

/** Tickets du collaborateur : employe_id + nom demandeur + portail (email). */
export async function listMesDemandes() {
  const { access, employe } = await resolveCollaborateurProfil();
  const supabase = await createSupabaseServerClient();
  const byId = new Map<string, IitsmTicket>();

  async function addRows(rows: IitsmTicket[] | null | undefined) {
    for (const t of rows ?? []) {
      byId.set(t.id, t);
    }
  }

  if (employe) {
    // 1) Lien fort FK
    const { data: byEmploye, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("employe_id", employe.id)
      .order("date", { ascending: false })
      .limit(100);

    if (!error) {
      await addRows(byEmploye as IitsmTicket[]);
    }

    // 2) Anciens tickets (avant sync) : même nom
    const name = employeDisplayName(employe.prenom, employe.nom);
    const { data: byName } = await supabase
      .from("tickets")
      .select("*")
      .ilike("demandeur", name)
      .order("date", { ascending: false })
      .limit(100);
    await addRows(byName as IitsmTicket[]);

    // Rattache silencieusement les tickets trouvés par nom sans employe_id
    if (!error) {
      const toLink = (byName ?? []).filter(
        (t) => !(t as IitsmTicket).employe_id || (t as IitsmTicket).employe_id !== employe.id
      );
      for (const t of toLink.slice(0, 50)) {
        await supabase
          .from("tickets")
          .update({ employe_id: employe.id, demandeur: name })
          .eq("id", t.id);
      }
    }
  }

  // 3) Demandes portail saisies avec cet email
  if (access.email) {
    const email = access.email;
    const [{ data: bySousCanal }, { data: byDemandeurEmail }] = await Promise.all([
      supabase
        .from("tickets")
        .select("*")
        .eq("canal", "Portail")
        .eq("sous_canal", email)
        .order("date", { ascending: false })
        .limit(100),
      supabase
        .from("tickets")
        .select("*")
        .ilike("demandeur", `%${email}%`)
        .order("date", { ascending: false })
        .limit(50),
    ]);
    await addRows(bySousCanal as IitsmTicket[]);
    await addRows(byDemandeurEmail as IitsmTicket[]);
  }

  const tickets = Array.from(byId.values()).sort((a, b) => {
    const da = `${a.date}T${a.heure_creation}`;
    const db = `${b.date}T${b.heure_creation}`;
    return db.localeCompare(da);
  });

  return { tickets, employe, access };
}

export async function createDemandeFromForm(formData: FormData) {
  const access = await requireTicketRequest();
  const supabase = await createSupabaseServerClient();
  const { employe } = await resolveCollaborateurProfil();

  const categorie = String(formData.get("categorie") ?? "").trim() || "Général";
  const description = String(formData.get("description") ?? "").trim();
  const entiteRaw = String(formData.get("entite") ?? "").trim();
  const priorite = String(formData.get("priorite") ?? "Normal").trim() || "Normal";

  if (!description) {
    throw new Error("Décrivez votre besoin.");
  }

  if (!ITSM_CATEGORIES.includes(categorie as (typeof ITSM_CATEGORIES)[number])) {
    throw new Error("Catégorie invalide.");
  }

  const demandeur = employe
    ? employeDisplayName(employe.prenom, employe.nom)
    : access.email ?? "Collaborateur";

  const entite =
    entiteRaw && ITSM_ENTITES.includes(entiteRaw as (typeof ITSM_ENTITES)[number])
      ? entiteRaw
      : "IAG";

  const date = todayDateStr();
  const heure_creation = nowTimeStr();
  const en_retard = computeEnRetardSaisie({
    date,
    heure_creation,
    resolved_at: null,
  });

  const payload: Record<string, unknown> = {
    demo: false,
    source: "saisie",
    approx_time: false,
    date,
    heure_creation,
    demandeur,
    entite,
    categorie,
    canal: "Portail",
    sous_canal: access.email,
    ticket_ref: null,
    technicien: DEFAULT_TECHNICIAN,
    statut: "Ouvert",
    priorite,
    en_retard,
    resolved_at: null,
    description,
  };

  if (employe) {
    payload.employe_id = employe.id;
  }

  const { data, error } = await supabase.from("tickets").insert(payload).select("id").maybeSingle();

  if (error) {
    if (error.message.includes("employe_id")) {
      delete payload.employe_id;
      const retry = await supabase.from("tickets").insert(payload).select("id").maybeSingle();
      if (retry.error) throw new Error(retry.error.message);
      await finalizeDemande(retry.data?.id ?? null, access, demandeur);
      redirect("/mes-demandes?created=1");
    }
    throw new Error(error.message);
  }

  await finalizeDemande(data?.id ?? null, access, demandeur);
  redirect("/mes-demandes?created=1");
}

async function finalizeDemande(
  ticketId: string | null,
  access: Awaited<ReturnType<typeof getAccess>>,
  demandeur: string
) {
  if (ticketId) {
    await logAudit({
      action: "ticket.portail.create",
      entityType: "tickets",
      entityId: ticketId,
      details: { by: access.userId, email: access.email, demandeur },
    });
  }
  revalidatePath("/mes-demandes");
  revalidatePath("/itsm");
  revalidatePath("/dashboard");
}
