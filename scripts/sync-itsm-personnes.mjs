#!/usr/bin/env node
/**
 * Rapproche demandeurs/tickets ITSM avec employés ITAM.
 * Prérequis : migration 20260819_08_itsm_personnes_employes.sql
 *
 * Usage: node scripts/sync-itsm-personnes.mjs
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function loadEnv() {
  const content = readFileSync(join(ROOT, ".env.local"), "utf8");
  const pick = (n) => content.match(new RegExp(`^${n}=(.+)$`, "m"))?.[1]?.trim();
  const url = pick("NEXT_PUBLIC_SUPABASE_URL");
  const key = pick("SUPABASE_SERVICE_ROLE_KEY") ?? pick("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!url || !key) throw new Error("Variables Supabase manquantes");
  return { url, key };
}

function normalize(v) {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function displayName(prenom, nom) {
  return `${prenom} ${nom}`.replace(/\s+/g, " ").trim();
}

function tokens(value) {
  return [...new Set(normalize(value).split(" ").filter((t) => t.length > 1))];
}

function overlap(a, b) {
  const ta = new Set(tokens(a));
  const tb = new Set(tokens(b));
  if (!ta.size || !tb.size) return 0;
  let c = 0;
  for (const t of ta) if (tb.has(t)) c++;
  return c / Math.min(ta.size, tb.size);
}

function match(label, employes) {
  const nl = normalize(label);
  let best = null;
  for (const e of employes) {
    const canonical = displayName(e.prenom, e.nom);
    if ([canonical, `${e.nom} ${e.prenom}`].some((v) => normalize(v) === nl)) {
      return { ...e, canonical, score: 1 };
    }
    const score = Math.max(overlap(label, canonical), overlap(label, `${e.nom} ${e.prenom}`));
    if (!best || score > best.score) best = { ...e, canonical, score };
  }
  return best && best.score >= 0.75 ? best : null;
}

async function main() {
  const { url, key } = loadEnv();
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { error: colErr } = await supabase.from("demandeurs").select("employe_id").limit(1);
  if (colErr?.message?.includes("employe_id")) {
    throw new Error(
      "Colonne employe_id absente. Appliquez d'abord la migration :\n" +
        "  supabase/migrations/20260819_08_itsm_personnes_employes.sql\n" +
        "(SQL Editor Supabase ou node scripts/apply-sql-migration.mjs ... avec SUPABASE_DB_URL)"
    );
  }

  const { data: employes, error: empErr } = await supabase
    .from("employes")
    .select("id, prenom, nom, statut")
    .order("nom");
  if (empErr) throw new Error(empErr.message);

  const actifs = (employes ?? []).filter((e) => (e.statut ?? "Actif") === "Actif");
  console.log(`${actifs.length} employé(s) actif(s)`);

  for (const e of actifs) {
    const name = displayName(e.prenom, e.nom);
    const { error } = await supabase.from("demandeurs").upsert(
      { name, source: "itam", employe_id: e.id },
      { onConflict: "name" }
    );
    if (error) throw new Error(`Upsert demandeur ${name}: ${error.message}`);
  }

  const { data: demandeurs } = await supabase.from("demandeurs").select("name, employe_id");
  const { data: tickets } = await supabase.from("tickets").select("id, demandeur, employe_id");

  let dm = 0;
  let tk = 0;
  const unmatched = [];

  for (const d of demandeurs ?? []) {
    if (d.employe_id) continue;
    const m = match(d.name, actifs);
    if (!m) {
      unmatched.push(d.name);
      continue;
    }
    await supabase
      .from("demandeurs")
      .update({ name: m.canonical, employe_id: m.id, source: "itam" })
      .eq("name", d.name);
    dm++;
  }

  for (const t of tickets ?? []) {
    const m = match(t.demandeur, actifs);
    if (!m) continue;
    if (t.employe_id === m.id && t.demandeur === m.canonical) continue;
    const { error } = await supabase
      .from("tickets")
      .update({ demandeur: m.canonical, employe_id: m.id })
      .eq("id", t.id);
    if (error) throw new Error(error.message);
    tk++;
  }

  console.log(`Demandeurs rapprochés : ${dm}`);
  console.log(`Tickets mis à jour   : ${tk}`);
  if (unmatched.length) {
    console.log(`Sans correspondance (${unmatched.length}) :`);
    unmatched.slice(0, 15).forEach((n) => console.log("  -", n));
  }
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
