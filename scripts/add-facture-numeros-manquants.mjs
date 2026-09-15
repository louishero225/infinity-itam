#!/usr/bin/env node
/**
 * Ajoute les numéros présents sur la facture Orange mais absents du registre,
 * puis synchronise les forfaits MIX 3 / MIX 5 (HT + TTC) pour toutes les lignes facture.
 *
 * Usage:
 *   node scripts/add-facture-numeros-manquants.mjs
 *   node scripts/add-facture-numeros-manquants.mjs --file "chemin/facture.pdf"
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { PDFParse } from "pdf-parse";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const DEFAULT_PDF =
  "c:/Users/KoffiGuillaumeBADOU/Downloads/facture_0009970561012026.pdf";

const FORFAITS = {
  3: { formule: "mix_3", montant_ht: 2119, montant_ttc: 2500 },
  5: { formule: "mix_5", montant_ht: 4237, montant_ttc: 5000 },
};

function loadEnv() {
  const content = readFileSync(join(ROOT, ".env.local"), "utf8");
  const url = content.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim();
  const key =
    content.match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)?.[1]?.trim() ||
    content.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)$/m)?.[1]?.trim();
  if (!url || !key) throw new Error("Variables Supabase manquantes dans .env.local");
  return { url, key };
}

function fmt(n) {
  return n.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5");
}

async function parseInvoice(pdfPath) {
  const buf = readFileSync(pdfPath);
  const parser = new PDFParse({ data: buf });
  const result = await parser.getText();
  const rows = [];
  for (const line of result.text.split(/\r?\n/)) {
    const m = line.match(
      /^(07\d{8})\s+BR MIX\s+(\d)_Orange Mix Hybrid\s+INFINTY AFRICA CAPITAL\s+([\d\s]+)$/
    );
    if (!m) continue;
    const mix = Number(m[2]);
    const forfait = FORFAITS[mix];
    if (!forfait) continue;
    rows.push({ numero: m[1], ...forfait });
  }
  const byNum = new Map();
  for (const r of rows) byNum.set(r.numero, r);
  return [...byNum.values()];
}

async function main() {
  const args = process.argv.slice(2);
  const fileIdx = args.indexOf("--file");
  const pdfPath = fileIdx >= 0 ? args[fileIdx + 1] : DEFAULT_PDF;

  const invoice = await parseInvoice(pdfPath);
  console.log(`Facture: ${invoice.length} lignes`);

  const { url, key } = loadEnv();
  const sb = createClient(url, key);

  // Vérifie colonnes forfaits
  const probe = await sb.from("numeros_flotte").select("id, formule, montant_ttc").limit(1);
  if (probe.error?.message?.includes("formule")) {
    throw new Error(
      "Colonnes forfaits absentes. Appliquez d'abord supabase/migrations/20260826_12_flotte_forfaits.sql"
    );
  }
  if (probe.error) throw probe.error;

  const { data: flotte, error } = await sb
    .from("numeros_flotte")
    .select("id, numero_normalise");
  if (error) throw error;

  const flotteMap = new Map((flotte ?? []).map((f) => [f.numero_normalise, f.id]));
  let inserted = 0;
  let updated = 0;

  for (const row of invoice) {
    const payload = {
      numero: fmt(row.numero),
      numero_normalise: row.numero,
      statut: "attribue",
      operateur: "Orange",
      formule: row.formule,
      montant_ht: row.montant_ht,
      montant_ttc: row.montant_ttc,
      source: "facture",
      notes: "Ajouté depuis facture Orange déc. 2025 (absent du registre Excel)",
    };

    const existingId = flotteMap.get(row.numero);
    if (existingId) {
      const { error: upErr } = await sb
        .from("numeros_flotte")
        .update({
          formule: row.formule,
          montant_ht: row.montant_ht,
          montant_ttc: row.montant_ttc,
        })
        .eq("id", existingId);
      if (upErr) throw upErr;
      updated++;
    } else {
      const { error: inErr } = await sb.from("numeros_flotte").insert(payload);
      if (inErr) throw inErr;
      console.log(`  + ${fmt(row.numero)} | ${row.formule} | ${row.montant_ttc} F TTC`);
      inserted++;
    }
  }

  const { count } = await sb
    .from("numeros_flotte")
    .select("*", { count: "exact", head: true });

  console.log(`Ajoutés: ${inserted}`);
  console.log(`Forfaits mis à jour: ${updated}`);
  console.log(`Total registre: ${count}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
