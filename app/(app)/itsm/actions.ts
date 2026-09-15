"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireWrite } from "@/lib/auth/roles";
import { logAudit } from "@/lib/server/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listPiecesJointes } from "@/app/(app)/fichiers/actions";
import { DEFAULT_TECHNICIAN, ONBOARDING_STEPS } from "@/lib/itsm/constants";
import { parseManageEngineCsv } from "@/lib/itsm/manageengine-import";
import { matchEmployeFromLabel } from "@/lib/itsm/person-matching";
import { pickDemandeurEmployeId } from "@/lib/itsm/ticket-context";
import {
  computeEnRetardSaisie,
  pad2,
  toIsoOrNull,
} from "@/lib/itsm/sla";
import { employeDisplayName } from "@/lib/utils/employe-matching";
import type { DemandeurParcContext } from "@/components/app/itsm/ticket-demandeur-parc-card";

export type IitsmTicket = {
  id: string;
  demo: boolean;
  source: "export" | "saisie";
  approx_time: boolean;
  date: string;
  heure_creation: string;
  demandeur: string;
  entite: string;
  categorie: string;
  canal: string;
  sous_canal: string | null;
  ticket_ref: string | null;
  technicien: string;
  statut: "Ouvert" | "En cours" | "Résolu" | "Fermé";
  priorite: string;
  en_retard: boolean;
  resolved_at: string | null;
  description: string | null;
  employe_id: string | null;
  created_at: string;
  updated_at: string;
};

async function ensureDemandeur(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  name: string,
  employeId?: string | null
) {
  const clean = name.trim();
  if (!clean) return;
  await supabase.from("demandeurs").upsert(
    { name: clean, source: "saisie", employe_id: employeId ?? null },
    { onConflict: "name" }
  );
}

export async function listEmployesForItsm() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("employes")
    .select("id, prenom, nom, departement, site, statut")
    .order("nom")
    .order("prenom");

  if (error) throw new Error(error.message);
  return (data ?? []).filter((e) => (e.statut ?? "Actif") === "Actif");
}

/** Rapproche demandeurs + tickets ITSM avec les employés ITAM. */
export async function syncPersonnesWithEmployes() {
  await requireWrite();
  const supabase = await createSupabaseServerClient();

  const employes = await listEmployesForItsm();
  if (employes.length === 0) {
    throw new Error("Aucun employé actif en base ITAM.");
  }

  // Annuaire demandeurs ← employés (nom canonique)
  for (const e of employes) {
    const name = employeDisplayName(e.prenom, e.nom);
    await supabase.from("demandeurs").upsert(
      { name, source: "itam", employe_id: e.id },
      { onConflict: "name" }
    );
  }

  const { data: demandeurs } = await supabase.from("demandeurs").select("name, employe_id");
  const { data: tickets } = await supabase.from("tickets").select("id, demandeur, employe_id");

  let demandeursMatched = 0;
  let ticketsUpdated = 0;
  const unmatched: string[] = [];

  for (const d of demandeurs ?? []) {
    if (d.employe_id) continue;
    const match = matchEmployeFromLabel(d.name, employes);
    if (!match) {
      unmatched.push(d.name);
      continue;
    }
    await supabase
      .from("demandeurs")
      .update({ name: match.canonical, employe_id: match.id, source: "itam" })
      .eq("name", d.name);
    demandeursMatched++;
  }

  for (const t of tickets ?? []) {
    const match = matchEmployeFromLabel(t.demandeur, employes);
    if (!match) continue;
    if (t.employe_id === match.id && t.demandeur === match.canonical) continue;
    await supabase
      .from("tickets")
      .update({ demandeur: match.canonical, employe_id: match.id })
      .eq("id", t.id);
    ticketsUpdated++;
  }

  await logAudit({
    action: "itsm.personnes.sync",
    entityType: "demandeurs",
    details: {
      employes: employes.length,
      demandeursMatched,
      ticketsUpdated,
      unmatched: unmatched.slice(0, 20),
    },
  });

  revalidatePath("/itsm");
  return {
    employes: employes.length,
    demandeursMatched,
    ticketsUpdated,
    unmatchedCount: unmatched.length,
    unmatchedSample: unmatched.slice(0, 10),
  };
}

function resolveDemandeurInput(formData: FormData, employes: Awaited<ReturnType<typeof listEmployesForItsm>>) {
  const employeId = String(formData.get("employe_id") ?? "").trim();
  let demandeur = String(formData.get("demandeur") ?? "").trim();

  if (employeId) {
    const emp = employes.find((e) => e.id === employeId);
    if (emp) {
      return { demandeur: employeDisplayName(emp.prenom, emp.nom), employe_id: emp.id };
    }
  }

  if (!demandeur) {
    throw new Error("Sélectionnez un employé ou saisissez un demandeur.");
  }

  const match = matchEmployeFromLabel(demandeur, employes);
  if (match) {
    return { demandeur: match.canonical, employe_id: match.id };
  }

  return { demandeur, employe_id: null as string | null };
}

export async function listDemandeurs() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("demandeurs")
    .select("name")
    .order("name");
  if (error) return [];
  return (data ?? []).map((r) => r.name);
}

export async function getItsmStats() {
  const supabase = await createSupabaseServerClient();

  const [
    { count: total },
    { count: ouverts },
    { count: enCours },
    { count: enRetard },
    { count: resolus },
    { count: fermes },
  ] = await Promise.all([
    supabase.from("tickets").select("*", { count: "exact", head: true }),
    supabase.from("tickets").select("*", { count: "exact", head: true }).eq("statut", "Ouvert"),
    supabase.from("tickets").select("*", { count: "exact", head: true }).eq("statut", "En cours"),
    supabase.from("tickets").select("*", { count: "exact", head: true }).eq("en_retard", true),
    supabase.from("tickets").select("*", { count: "exact", head: true }).eq("statut", "Résolu"),
    supabase.from("tickets").select("*", { count: "exact", head: true }).eq("statut", "Fermé"),
  ]);

  return {
    total: total ?? 0,
    ouverts: (ouverts ?? 0) + (enCours ?? 0),
    enRetard: enRetard ?? 0,
    resolus: (resolus ?? 0) + (fermes ?? 0),
  };
}

export async function getFaitsMarquantsToday() {
  const supabase = await createSupabaseServerClient();
  const today = new Date();
  const date = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
  const { data } = await supabase
    .from("faits_marquants")
    .select("note")
    .eq("date", date)
    .maybeSingle();
  return data?.note ?? "";
}

export async function saveFaitsMarquants(note: string) {
  await requireWrite();
  const supabase = await createSupabaseServerClient();
  const today = new Date();
  const date = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;

  const { error } = await supabase.from("faits_marquants").upsert(
    { date, note, updated_at: new Date().toISOString() },
    { onConflict: "date" }
  );
  if (error) throw new Error(error.message);

  revalidatePath("/itsm");
}

export async function listTickets(limit = 200) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .order("date", { ascending: false })
    .order("heure_creation", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []) as IitsmTicket[];
}

type AttributionParcRow = {
  id: string;
  date_attribution: string;
  materiel: {
    id: string;
    code_materiel: string;
    type: string;
    marque: string | null;
    modele: string | null;
    statut: string | null;
  } | null;
};

async function resolveMatchedEmployeId(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  demandeur: string
) {
  const { data: employes } = await supabase
    .from("employes")
    .select("id, prenom, nom, statut")
    .order("nom");
  const actifs = (employes ?? []).filter((e) => (e.statut ?? "Actif") === "Actif");
  return matchEmployeFromLabel(demandeur, actifs)?.id ?? null;
}

export async function getDemandeurParcContext(input: {
  employeId?: string | null;
  demandeur: string;
}): Promise<DemandeurParcContext> {
  const supabase = await createSupabaseServerClient();

  const matchedEmployeId = input.employeId?.trim()
    ? null
    : await resolveMatchedEmployeId(supabase, input.demandeur);

  const employeId = pickDemandeurEmployeId({
    ticketEmployeId: input.employeId,
    matchedEmployeId,
  });

  const resolvedVia: DemandeurParcContext["resolvedVia"] = input.employeId?.trim()
    ? "employe_id"
    : employeId
      ? "nom"
      : null;

  if (!employeId) {
    return { employe: null, materiels: [], resolvedVia: null };
  }

  const [{ data: employe }, { data: attributions }] = await Promise.all([
    supabase
      .from("employes")
      .select("id, prenom, nom, departement, site, fonction")
      .eq("id", employeId)
      .maybeSingle(),
    supabase
      .from("attributions")
      .select(
        `id, date_attribution,
         materiel:materiel_id (id, code_materiel, type, marque, modele, statut)`
      )
      .eq("employe_id", employeId)
      .eq("statut", "Actif")
      .order("date_attribution", { ascending: false })
      .returns<AttributionParcRow[]>(),
  ]);

  return {
    employe: employe
      ? {
          id: employe.id,
          prenom: employe.prenom,
          nom: employe.nom,
          departement: employe.departement,
          site: employe.site,
          fonction: employe.fonction,
        }
      : null,
    materiels: (attributions ?? []).map((a) => ({
      attribution_id: a.id,
      date_attribution: a.date_attribution,
      materiel: a.materiel,
    })),
    resolvedVia: employe ? resolvedVia : null,
  };
}

export async function listTicketsForEmploye(employeId: string, limit = 30) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("tickets")
    .select("id, date, heure_creation, demandeur, categorie, statut, en_retard, description")
    .eq("employe_id", employeId)
    .order("date", { ascending: false })
    .order("heure_creation", { ascending: false })
    .limit(limit);

  // Colonne employe_id absente (migration 08 non appliquée) → repli par nom
  if (error?.message?.includes("employe_id")) {
    const { data: emp } = await supabase
      .from("employes")
      .select("prenom, nom")
      .eq("id", employeId)
      .maybeSingle();
    if (!emp) return [];
    const name = employeDisplayName(emp.prenom, emp.nom);
    const { data: byName, error: nameError } = await supabase
      .from("tickets")
      .select("id, date, heure_creation, demandeur, categorie, statut, en_retard, description")
      .ilike("demandeur", name)
      .order("date", { ascending: false })
      .limit(limit);
    if (nameError) return [];
    return byName ?? [];
  }

  if (error) return [];
  return data ?? [];
}

export async function getTicketDetail(ticketId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", ticketId)
    .maybeSingle();

  if (ticketError) throw new Error(ticketError.message);
  if (!ticket) return null;

  const typedTicket = ticket as IitsmTicket;

  let comments: Array<{
    id: string;
    ticket_id: string;
    contenu: string;
    created_by: string | null;
    created_by_email: string | null;
    created_at: string;
    is_internal: boolean;
  }> = [];

  const commentsQuery = await supabase
    .from("ticket_comments")
    .select("id, ticket_id, contenu, created_by, created_by_email, created_at, is_internal")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (commentsQuery.error?.message.includes("is_internal")) {
    const legacy = await supabase
      .from("ticket_comments")
      .select("id, ticket_id, contenu, created_by, created_by_email, created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    if (legacy.error) throw new Error(legacy.error.message);
    comments = (legacy.data ?? []).map((c) => ({ ...c, is_internal: false }));
  } else if (commentsQuery.error) {
    throw new Error(commentsQuery.error.message);
  } else {
    comments = (commentsQuery.data ?? []).map((c) => ({
      ...c,
      is_internal: Boolean(c.is_internal),
    }));
  }

  const [{ data: history, error: historyError }, pieces, demandeurParc] = await Promise.all([
    supabase
      .from("audit_log")
      .select("id, created_at, user_email, action, entity_type, entity_id, details")
      .eq("entity_type", "tickets")
      .eq("entity_id", ticketId)
      .order("created_at", { ascending: false })
      .limit(50),
    listPiecesJointes("itsm_ticket", ticketId),
    getDemandeurParcContext({
      employeId: typedTicket.employe_id,
      demandeur: typedTicket.demandeur,
    }),
  ]);

  if (historyError) throw new Error(historyError.message);

  return {
    ticket: typedTicket,
    comments,
    pieces,
    history: history ?? [],
    demandeurParc,
  };
}

export async function createTicketFromForm(formData: FormData) {
  const access = await requireWrite();
  const supabase = await createSupabaseServerClient();
  const employes = await listEmployesForItsm();

  const date = String(formData.get("date") ?? "");
  const heure_creation = String(formData.get("heure_creation") ?? "");
  const { demandeur, employe_id } = resolveDemandeurInput(formData, employes);
  const entite = String(formData.get("entite") ?? "").trim();
  const categorie = String(formData.get("categorie") ?? "").trim();
  const canal = String(formData.get("canal") ?? "").trim();
  const sous_canal = String(formData.get("sous_canal") ?? "").trim();
  const ticket_ref_raw = String(formData.get("ticket_ref") ?? "").trim();
  const priorite = String(formData.get("priorite") ?? "").trim();
  const statut = String(formData.get("statut") ?? "Ouvert") as IitsmTicket["statut"];
  const resolved_at_str = String(formData.get("resolved_at") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!date || !heure_creation) {
    throw new Error("Date et heure sont obligatoires.");
  }

  const resolvedIso = toIsoOrNull(resolved_at_str);
  const en_retard = computeEnRetardSaisie({
    date,
    heure_creation,
    resolved_at: resolvedIso,
    priorite: priorite || "Non défini",
  });

  const { data, error } = await supabase
    .from("tickets")
    .insert({
      demo: false,
      source: "saisie",
      approx_time: false,
      date,
      heure_creation,
      demandeur,
      employe_id,
      entite: entite || "Siège / Accueil",
      categorie: categorie || "Non catégorisé",
      canal: canal || "Verbal",
      sous_canal: sous_canal || null,
      ticket_ref: ticket_ref_raw || null,
      technicien: DEFAULT_TECHNICIAN,
      statut,
      priorite: priorite || "Non défini",
      en_retard,
      resolved_at: resolvedIso,
      description,
    })
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Insertion impossible.");

  await ensureDemandeur(supabase, demandeur, employe_id);

  await logAudit({
    action: "ticket.create",
    entityType: "tickets",
    entityId: data.id,
    details: { by: access.userId, en_retard },
  });

  revalidatePath("/itsm");
  redirect(`/itsm/tickets/${data.id}`);
}

export async function updateTicketFromForm(formData: FormData) {
  const access = await requireWrite();
  const supabase = await createSupabaseServerClient();

  const ticketId = String(formData.get("ticket_id") ?? "").trim();
  if (!ticketId) throw new Error("ticket_id manquant.");

  const statut = String(formData.get("statut") ?? "") as IitsmTicket["statut"];
  const priorite = String(formData.get("priorite") ?? "").trim();
  const technicien = String(formData.get("technicien") ?? "").trim();
  const resolved_at_str = String(formData.get("resolved_at") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;

  const { data: existing, error: existingError } = await supabase
    .from("tickets")
    .select(
      "id, ticket_ref, date, heure_creation, resolved_at, statut, priorite, technicien, source, demandeur, categorie, description, employe_id, sous_canal, canal"
    )
    .eq("id", ticketId)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);
  if (!existing) throw new Error("Ticket introuvable.");

  const nextPriorite = priorite || existing.priorite;
  const nextStatut = (statut || existing.statut) as IitsmTicket["statut"];
  const resolvedIso = toIsoOrNull(resolved_at_str);
  const en_retard =
    existing.source === "export"
      ? undefined
      : computeEnRetardSaisie({
          date: existing.date,
          heure_creation: existing.heure_creation,
          resolved_at: resolvedIso,
          priorite: nextPriorite,
        });

  const { error } = await supabase
    .from("tickets")
    .update({
      statut: nextStatut,
      priorite: nextPriorite,
      technicien: technicien || existing.technicien,
      resolved_at: resolvedIso,
      description,
      ...(en_retard !== undefined ? { en_retard } : {}),
    })
    .eq("id", ticketId);

  if (error) throw new Error(error.message);

  await logAudit({
    action: "ticket.update",
    entityType: "tickets",
    entityId: ticketId,
    details: { by: access.userId, statut: nextStatut, priorite: nextPriorite, technicien, en_retard },
  });

  if (nextStatut !== existing.statut) {
    try {
      const { notifyRequesterStatusChange } = await import("@/lib/itsm/ticket-email");
      await notifyRequesterStatusChange({
        ticket: {
          id: existing.id,
          ticket_ref: existing.ticket_ref,
          demandeur: existing.demandeur,
          categorie: existing.categorie,
          statut: nextStatut,
          priorite: nextPriorite,
          description: description ?? existing.description,
          employe_id: existing.employe_id,
          sous_canal: existing.sous_canal,
          canal: existing.canal,
        },
        fromStatut: existing.statut,
        toStatut: nextStatut,
      });
    } catch {
      // non bloquant
    }
  }

  revalidatePath(`/itsm/tickets/${ticketId}`);
  revalidatePath("/itsm");
}

/** Mise à jour rapide du statut (Kanban). */
export async function updateTicketStatut(ticketId: string, statut: IitsmTicket["statut"]) {
  const access = await requireWrite();
  const supabase = await createSupabaseServerClient();
  const id = ticketId.trim();
  if (!id) throw new Error("ticket_id manquant.");

  const { data: existing, error: existingError } = await supabase
    .from("tickets")
    .select(
      "id, ticket_ref, date, heure_creation, resolved_at, statut, priorite, source, demandeur, categorie, description, employe_id, sous_canal, canal"
    )
    .eq("id", id)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);
  if (!existing) throw new Error("Ticket introuvable.");

  const closing = statut === "Résolu" || statut === "Fermé";
  const wasOpen = existing.statut !== "Résolu" && existing.statut !== "Fermé";
  const resolved_at =
    closing && wasOpen && !existing.resolved_at
      ? new Date().toISOString()
      : !closing
        ? null
        : existing.resolved_at;

  const en_retard =
    existing.source === "export"
      ? undefined
      : computeEnRetardSaisie({
          date: existing.date,
          heure_creation: existing.heure_creation,
          resolved_at,
          priorite: existing.priorite,
        });

  const { error } = await supabase
    .from("tickets")
    .update({
      statut,
      resolved_at,
      ...(en_retard !== undefined ? { en_retard } : {}),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await logAudit({
    action: "ticket.statut",
    entityType: "tickets",
    entityId: id,
    details: { by: access.userId, from: existing.statut, to: statut },
  });

  if (statut !== existing.statut) {
    try {
      const { notifyRequesterStatusChange } = await import("@/lib/itsm/ticket-email");
      await notifyRequesterStatusChange({
        ticket: {
          id: existing.id,
          ticket_ref: existing.ticket_ref,
          demandeur: existing.demandeur,
          categorie: existing.categorie,
          statut,
          priorite: existing.priorite,
          description: existing.description,
          employe_id: existing.employe_id,
          sous_canal: existing.sous_canal,
          canal: existing.canal,
        },
        fromStatut: existing.statut,
        toStatut: statut,
      });
    } catch {
      // non bloquant
    }
  }

  revalidatePath(`/itsm/tickets/${id}`);
  revalidatePath("/itsm");
  revalidatePath("/dashboard");
}

/** Assignation rapide d'un ticket. */
export async function assignTicket(ticketId: string, technicien: string) {
  const access = await requireWrite();
  const supabase = await createSupabaseServerClient();
  const id = ticketId.trim();
  const tech = technicien.trim() || "Non assigné";
  if (!id) throw new Error("ticket_id manquant.");

  const { error } = await supabase.from("tickets").update({ technicien: tech }).eq("id", id);
  if (error) throw new Error(error.message);

  await logAudit({
    action: "ticket.assign",
    entityType: "tickets",
    entityId: id,
    details: { by: access.userId, technicien: tech },
  });

  revalidatePath(`/itsm/tickets/${id}`);
  revalidatePath("/itsm");
  revalidatePath("/dashboard");
}

/** Actions en masse (statut et/ou assignation). */
export async function bulkUpdateTickets(args: {
  ticketIds: string[];
  statut?: IitsmTicket["statut"];
  technicien?: string;
}) {
  const access = await requireWrite();
  const supabase = await createSupabaseServerClient();
  const ids = [...new Set(args.ticketIds.map((id) => id.trim()).filter(Boolean))].slice(0, 100);
  if (ids.length === 0) throw new Error("Aucun ticket sélectionné.");

  const { data: rows, error: loadError } = await supabase
    .from("tickets")
    .select("id, date, heure_creation, resolved_at, statut, priorite, source")
    .in("id", ids);

  if (loadError) throw new Error(loadError.message);

  let updated = 0;
  for (const row of rows ?? []) {
    const patch: Record<string, unknown> = {};
    if (args.technicien !== undefined) {
      patch.technicien = args.technicien.trim() || "Non assigné";
    }
    if (args.statut) {
      const closing = args.statut === "Résolu" || args.statut === "Fermé";
      const wasOpen = row.statut !== "Résolu" && row.statut !== "Fermé";
      patch.statut = args.statut;
      if (closing && wasOpen && !row.resolved_at) {
        patch.resolved_at = new Date().toISOString();
      } else if (!closing) {
        patch.resolved_at = null;
      }
      if (row.source !== "export") {
        patch.en_retard = computeEnRetardSaisie({
          date: row.date,
          heure_creation: row.heure_creation,
          resolved_at: (patch.resolved_at as string | null | undefined) ?? row.resolved_at,
          priorite: row.priorite,
        });
      }
    }
    if (Object.keys(patch).length === 0) continue;
    const { error } = await supabase.from("tickets").update(patch).eq("id", row.id);
    if (!error) updated++;
  }

  await logAudit({
    action: "ticket.bulk",
    entityType: "tickets",
    details: {
      by: access.userId,
      count: updated,
      statut: args.statut,
      technicien: args.technicien,
    },
  });

  revalidatePath("/itsm");
  revalidatePath("/dashboard");
  return { updated };
}

export async function addTicketCommentFromForm(formData: FormData) {
  const access = await requireWrite();
  const supabase = await createSupabaseServerClient();

  const ticketId = String(formData.get("ticket_id") ?? "").trim();
  if (!ticketId) throw new Error("ticket_id manquant.");

  const contenu = String(formData.get("contenu") ?? "").trim();
  if (!contenu) throw new Error("Commentaire vide.");

  const is_internal =
    formData.get("is_internal") === "on" ||
    formData.get("is_internal") === "true" ||
    formData.get("is_internal") === "1";

  const { data: ticketRow, error: ticketError } = await supabase
    .from("tickets")
    .select(
      "id, ticket_ref, demandeur, categorie, statut, priorite, description, employe_id, sous_canal, canal"
    )
    .eq("id", ticketId)
    .maybeSingle();

  if (ticketError) throw new Error(ticketError.message);
  if (!ticketRow) throw new Error("Ticket introuvable.");

  const { error } = await supabase.from("ticket_comments").insert({
    ticket_id: ticketId,
    contenu,
    is_internal,
    created_by: access.userId,
    created_by_email: access.email ?? null,
  });

  if (error) {
    if (error.message.includes("is_internal")) {
      throw new Error(
        "Colonne is_internal absente — appliquez la migration 20260821_10_ticket_comments_internal.sql"
      );
    }
    throw new Error(error.message);
  }

  await logAudit({
    action: is_internal ? "ticket.comment.internal" : "ticket.comment.add",
    entityType: "tickets",
    entityId: ticketId,
    details: { by: access.userId, is_internal },
  });

  // Note interne : pas d'e-mail au demandeur
  if (!is_internal) {
    try {
      const { notifyRequesterPublicComment } = await import("@/lib/itsm/ticket-email");
      await notifyRequesterPublicComment({
        ticket: ticketRow,
        comment: contenu,
        authorEmail: access.email,
      });
    } catch {
      // Ne bloque pas la publication si Resend échoue
    }
  }

  revalidatePath(`/itsm/tickets/${ticketId}`);
  revalidatePath("/itsm");
}

export async function importManageEngineCsv(formData: FormData) {
  await requireWrite();
  const supabase = await createSupabaseServerClient();
  const access = await getAccessSafe();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Fichier CSV manquant.");
  }

  const csvText = await file.text();
  const { data: existingRows } = await supabase
    .from("tickets")
    .select("ticket_ref")
    .not("ticket_ref", "is", null);

  const existingRefs = new Set(
    (existingRows ?? []).map((r) => r.ticket_ref).filter(Boolean) as string[]
  );

  const toInsert = parseManageEngineCsv(csvText, existingRefs);
  if (toInsert.length === 0) {
    return { imported: 0, skipped: existingRefs.size };
  }

  const { error } = await supabase.from("tickets").insert(toInsert);
  if (error) throw new Error(error.message);

  const demandeurs = [...new Set(toInsert.map((t) => t.demandeur).filter(Boolean))];
  const employes = await listEmployesForItsm();
  for (const d of demandeurs) {
    const match = matchEmployeFromLabel(d, employes);
    await ensureDemandeur(supabase, match?.canonical ?? d, match?.id ?? null);
  }

  await syncPersonnesWithEmployes();

  await logAudit({
    action: "ticket.import.csv",
    entityType: "tickets",
    details: { by: access?.userId, imported: toInsert.length },
  });

  revalidatePath("/itsm");
  return { imported: toInsert.length, skipped: existingRefs.size - toInsert.length };
}

export async function generateOnboardingTickets(formData: FormData) {
  await requireWrite();
  const supabase = await createSupabaseServerClient();
  const access = await getAccessSafe();

  const nom = String(formData.get("ob_nom") ?? "").trim();
  const entite = String(formData.get("ob_entite") ?? "IAG").trim();
  const startDate = String(formData.get("ob_date") ?? "").trim();

  if (!nom || !startDate) {
    throw new Error("Nom et date de début obligatoires.");
  }

  const employes = await listEmployesForItsm();
  const match = matchEmployeFromLabel(nom, employes);
  const demandeur = match?.canonical ?? nom;
  const employe_id = match?.id ?? null;

  const tickets = ONBOARDING_STEPS.map((step) => {
    const d = new Date(`${startDate}T00:00:00`);
    d.setDate(d.getDate() + step.offsetDays);
    const dateStr = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    const en_retard = computeEnRetardSaisie({
      date: dateStr,
      heure_creation: step.heure,
      resolved_at: null,
      priorite: "Normal",
    });

    return {
      demo: false,
      source: "saisie" as const,
      approx_time: false,
      date: dateStr,
      heure_creation: step.heure,
      demandeur,
      employe_id,
      entite,
      categorie: step.categorie,
      canal: "Verbal",
      sous_canal: "Direct",
      ticket_ref: null,
      technicien: DEFAULT_TECHNICIAN,
      statut: "Ouvert" as const,
      priorite: "Normal",
      en_retard,
      resolved_at: null,
      description: step.description,
    };
  });

  const { error } = await supabase.from("tickets").insert(tickets);
  if (error) throw new Error(error.message);

  await ensureDemandeur(supabase, demandeur, employe_id);

  await logAudit({
    action: "ticket.onboarding.generate",
    entityType: "tickets",
    details: { by: access?.userId, nom, count: tickets.length },
  });

  revalidatePath("/itsm");
  return { created: tickets.length };
}

async function getAccessSafe() {
  try {
    const { getAccess } = await import("@/lib/auth/roles");
    return await getAccess();
  } catch {
    return null;
  }
}
