"use server";

import { revalidatePath } from "next/cache";

import { exportAttributionsCsv, exportMaterielsCsv } from "@/app/(app)/rapports/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    const needs = /[",\n]/.test(s);
    const escaped = s.replace(/"/g, '""');
    return needs ? `"${escaped}"` : escaped;
  };

  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
}

export async function exportEmployesCsv() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("employes")
    .select("*")
    .order("nom");
  if (error) throw new Error(error.message);
  return toCsv((data ?? []) as Record<string, unknown>[]);
}

export async function exportParcCompletCsv() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("materiels")
    .select(`
      *,
      attributions (
        statut,
        date_attribution,
        employe:employes ( prenom, nom, departement )
      )
    `)
    .order("code_materiel");

  if (error) throw new Error(error.message);

  const rows = (data ?? []).map((m) => {
    const active = m.attributions?.find(
      (a: { statut: string | null }) => a.statut === "Actif"
    ) as
      | {
          date_attribution: string;
          employe: { prenom: string; nom: string; departement: string } | null;
        }
      | undefined;

    return {
      code_materiel: m.code_materiel,
      type: m.type,
      marque: m.marque,
      modele: m.modele,
      numero_serie: m.numero_serie,
      statut: m.statut,
      etat: m.etat,
      date_achat: m.date_achat,
      cout: m.cout,
      utilisateur: active?.employe
        ? `${active.employe.prenom} ${active.employe.nom}`
        : "",
      departement: active?.employe?.departement ?? "",
      date_attribution: active?.date_attribution ?? "",
      observations: m.observations,
    };
  });

  return toCsv(rows);
}

export async function generateGarantieAlertes() {
  const supabase = await createSupabaseServerClient();
  const today = new Date();
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 90);

  const { data: materiels, error } = await supabase
    .from("materiels")
    .select("id, code_materiel, type, observations");

  if (error) throw new Error(error.message);

  const { data: existing } = await supabase
    .from("alertes")
    .select("materiel_id")
    .eq("type", "garantie")
    .eq("statut", "active");

  const existingIds = new Set((existing ?? []).map((a) => a.materiel_id));
  let created = 0;

  for (const m of materiels ?? []) {
    if (!m.observations || existingIds.has(m.id)) continue;

    const match = m.observations.match(/Fin de garantie:\s*(\d{4}-\d{2}-\d{2})/);
    if (!match) continue;

    const expiry = new Date(match[1]);
    if (expiry > horizon) continue;

    const priorite =
      expiry < today ? "critique" : expiry < new Date(today.getTime() + 30 * 86400000) ? "haute" : "normale";

    const { error: insertError } = await supabase.from("alertes").insert({
      type: "garantie",
      titre: `Fin de garantie — ${m.code_materiel}`,
      description: `${m.type} ${m.code_materiel} — garantie expire le ${match[1]}`,
      priorite,
      date_echeance: match[1],
      materiel_id: m.id,
      statut: "active",
    });

    if (!insertError) {
      created++;
      existingIds.add(m.id);
    }
  }

  const { data: licences } = await supabase
    .from("licences")
    .select("id, nom, date_expiration")
    .not("date_expiration", "is", null)
    .lte("date_expiration", horizon.toISOString().slice(0, 10));

  for (const l of licences ?? []) {
    const { data: dup } = await supabase
      .from("alertes")
      .select("id")
      .eq("licence_id", l.id)
      .eq("type", "renouvellement")
      .eq("statut", "active")
      .maybeSingle();

    if (dup) continue;

    const { error: insertError } = await supabase.from("alertes").insert({
      type: "renouvellement",
      titre: `Renouvellement licence — ${l.nom}`,
      description: `Licence ${l.nom} expire le ${l.date_expiration}`,
      priorite: "haute",
      date_echeance: l.date_expiration,
      licence_id: l.id,
      statut: "active",
    });

    if (!insertError) created++;
  }

  revalidatePath("/alertes");
  revalidatePath("/dashboard");

  return { created };
}

export { exportMaterielsCsv, exportAttributionsCsv };
