#!/usr/bin/env node
/**
 * Applique les forfaits MIX 3 / MIX 5 (HT + TTC) depuis une facture Orange PDF
 * sur les numéros déjà présents dans numeros_flotte.
 *
 * Usage:
 *   node scripts/sync-flotte-forfaits.mjs
 *   node scripts/sync-flotte-forfaits.mjs --file "chemin/facture.pdf"
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
  console.log(`Facture: ${invoice.length} lignes forfait`);

  const { url, key } = loadEnv();
  const sb = createClient(url, key);

  const { data: flotte, error } = await sb
    .from("numeros_flotte")
    .select("id, numero_normalise, numero");
  if (error) throw error;

  const flotteSet = new Set((flotte ?? []).map((f) => f.numero_normalise));
  let updated = 0;
  let missingInDb = 0;

  for (const row of invoice) {
    if (!flotteSet.has(row.numero)) {
      missingInDb++;
      console.log(`  ABSENT système: ${fmt(row.numero)} (${row.formule})`);
      continue;
    }
    const { error: upErr } = await sb
      .from("numeros_flotte")
      .update({
        formule: row.formule,
        montant_ht: row.montant_ht,
        montant_ttc: row.montant_ttc,
      })
      .eq("numero_normalise", row.numero);
    if (upErr) throw upErr;
    updated++;
  }

  console.log(`Mis à jour: ${updated}`);
  console.log(`Sur facture absents du système: ${missingInDb}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
