#!/usr/bin/env node
/** Rapproche les numéros flotte sans employe_id avec les fiches ITAM. */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function loadEnv() {
  const content = readFileSync(join(ROOT, ".env.local"), "utf8");
  const url = content.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim();
  const key =
    content.match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)?.[1]?.trim() ||
    content.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)$/m)?.[1]?.trim();
  if (!url || !key) throw new Error("Variables Supabase manquantes");
  return createClient(url, key);
}

function normalizeText(v) {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(v) {
  return [...new Set(normalizeText(v).split(" ").filter((t) => t.length > 1))];
}

function scoreLabel(label, e) {
  const prenomParts = e.prenom.trim().split(/\s+/);
  const variants = [
    `${e.prenom} ${e.nom}`,
    `${e.nom} ${e.prenom}`,
    `${e.nom} ${prenomParts[prenomParts.length - 1]}`,
  ];
  let best = 0;
  for (const v of variants) {
    if (normalizeText(v) === normalizeText(label)) return 1;
    const lt = new Set(tokens(label));
    const vt = new Set(tokens(v));
    if (lt.size === 0 || vt.size === 0) continue;
    let common = 0;
    for (const t of lt) if (vt.has(t)) common++;
    best = Math.max(best, common / Math.min(lt.size, vt.size));
  }
  return best;
}

function matchEmploye(label, employes) {
  let best = null;
  for (const e of employes) {
    const score = scoreLabel(label, e);
    if (score === 1) return e;
    if (!best || score > best.score) best = { ...e, score };
  }
  return best && best.score >= 0.75 ? best : null;
}

async function main() {
  const supabase = loadEnv();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: numeros }, { data: employes }] = await Promise.all([
    supabase.from("numeros_flotte").select("id, numero, titulaire_libre, employe_id"),
    supabase.from("employes").select("id, prenom, nom, departement"),
  ]);

  const sans = (numeros ?? []).filter((n) => !n.employe_id && n.titulaire_libre);
  console.log(`${sans.length} numéro(s) à rapprocher`);

  let fixed = 0;
  for (const n of sans) {
    const m = matchEmploye(n.titulaire_libre, employes ?? []);
    if (!m) {
      console.log("  NON MATCH:", n.numero, "·", n.titulaire_libre);
      continue;
    }
    await supabase
      .from("numeros_flotte")
      .update({
        employe_id: m.id,
        titulaire_libre: null,
        departement: m.departement ?? undefined,
      })
      .eq("id", n.id);

    await supabase.from("numeros_flotte_historique").insert({
      numero_flotte_id: n.id,
      employe_id: m.id,
      departement: m.departement,
      date_debut: today,
      motif: "Rapprochement employé post-import",
    });

    console.log("  OK:", n.numero, "→", `${m.prenom} ${m.nom}`);
    fixed++;
  }

  const { data: check } = await supabase
    .from("numeros_flotte")
    .select("id", { count: "exact", head: true })
    .is("employe_id", null)
    .not("titulaire_libre", "is", null);

  console.log(`\nRapprochés: ${fixed}`);
  console.log(`Reste sans employe_id (avec titulaire libre): ${check?.length ?? "?"}`);

  const { count: total } = await supabase
    .from("numeros_flotte")
    .select("*", { count: "exact", head: true });
  const { count: linked } = await supabase
    .from("numeros_flotte")
    .select("*", { count: "exact", head: true })
    .not("employe_id", "is", null);

  console.log(`Total: ${total} · Liés ITAM: ${linked}`);

  // Backfill historique si absent
  let histAdded = 0;
  for (const n of numeros ?? []) {
    const { count } = await supabase
      .from("numeros_flotte_historique")
      .select("*", { count: "exact", head: true })
      .eq("numero_flotte_id", n.id);
    if (count && count > 0) continue;
    const emp = (employes ?? []).find((e) => e.id === n.employe_id);
    await supabase.from("numeros_flotte_historique").insert({
      numero_flotte_id: n.id,
      employe_id: n.employe_id,
      titulaire_libre: n.titulaire_libre,
      departement: emp?.departement ?? null,
      date_debut: today,
      motif: "Import Excel Août 2026",
    });
    histAdded++;
  }
  if (histAdded) console.log(`Historique: ${histAdded} entrée(s) créée(s)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
