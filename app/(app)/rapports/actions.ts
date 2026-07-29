"use server";

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

export async function exportMaterielsCsv() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("materiels").select("*").order("code_materiel");
  if (error) throw new Error(error.message);
  return toCsv((data ?? []) as Record<string, unknown>[]);
}

export async function exportAttributionsCsv() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("v_historique_attributions")
    .select("*")
    .order("date_attribution", { ascending: false });
  if (error) throw new Error(error.message);
  return toCsv((data ?? []) as Record<string, unknown>[]);
}
