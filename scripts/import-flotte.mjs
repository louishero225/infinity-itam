#!/usr/bin/env node
/**
 * Import Excel flotte Orange → Supabase
 *
 * Usage:
 *   node scripts/import-flotte.mjs
 *   node scripts/import-flotte.mjs --execute
 *   node scripts/import-flotte.mjs --file "path.xlsx" --execute
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const DEFAULT_FILE =
  "c:/Users/KoffiGuillaumeBADOU/OneDrive - Infinity Africa Group/Documents/INVENTAIRE MATERIEL IAG/Liste Attributions Numeros Flotte IAG Aout 2026.xlsx";

const args = process.argv.slice(2);
const EXECUTE = args.includes("--execute");
const FILE = (() => {
  const i = args.indexOf("--file");
  return i >= 0 && args[i + 1] ? args[i + 1] : DEFAULT_FILE;
})();

function loadEnv() {
  const envPath = join(ROOT, ".env.local");
  const content = readFileSync(envPath, "utf8");
  const url = content.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim();
  const key =
    content.match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m)?.[1]?.trim() ||
    content.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)$/m)?.[1]?.trim();
  if (!url || !key) throw new Error("Variables Supabase manquantes dans .env.local");
  return { url, key };
}

function normalizePhone(raw) {
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("07")) return digits;
  if (digits.length === 12 && digits.startsWith("22507")) return digits.slice(3);
  return null;
}

function formatPhone(d) {
  return `${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 6)} ${d.slice(6, 8)} ${d.slice(8, 10)}`;
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

function matchEmploye(label, employes) {
  const nl = normalizeText(label);
  let best = null;
  for (const e of employes) {
    const prenomParts = e.prenom.trim().split(/\s+/);
    const variants = [
      normalizeText(`${e.prenom} ${e.nom}`),
      normalizeText(`${e.nom} ${e.prenom}`),
      normalizeText(`${e.nom} ${prenomParts[prenomParts.length - 1]}`),
    ];
    if (variants.includes(nl)) return e;
    const tokens = nl.split(" ").filter((t) => t.length > 1);
    for (const v of variants) {
      const vt = new Set(v.split(" "));
      const common = tokens.filter((t) => vt.has(t)).length;
      const score = common / Math.min(tokens.length, vt.size);
      if (!best || score > best.score) best = { ...e, score };
    }
  }
  return best && best.score >= 0.75 ? best : null;
}

function parseRows(wb) {
  const sheetName = wb.SheetNames.find((n) => /flotte|num/i.test(n)) ?? wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: "" });
  let departement = "";
  const items = [];
  for (const row of rows) {
    const [colDept, colNom, colFonction, colNumero] = row;
    if (colDept && !colNom && !colNumero) {
      departement = String(colDept).trim();
      continue;
    }
    const nom = String(colNom ?? "").trim();
    const numero = String(colNumero ?? "").trim();
    if (!nom || !numero) continue;
    items.push({ departement, titulaire: nom, fonction: String(colFonction ?? "").trim(), numero });
  }
  return items;
}

async function main() {
  console.log(`Fichier: ${FILE}`);
  console.log(`Mode: ${EXECUTE ? "EXECUTE" : "DRY-RUN"}`);

  const wb = XLSX.readFile(FILE);
  const items = parseRows(wb);
  console.log(`${items.length} attributions trouvées`);

  if (!EXECUTE) {
    items.slice(0, 5).forEach((i) => console.log(" ", i.departement, "·", i.titulaire, "·", i.numero));
    console.log("\nRelancez avec --execute pour importer.");
    return;
  }

  const { url, key } = loadEnv();
  const supabase = createClient(url, key);

  const { data: employes } = await supabase
    .from("employes")
    .select("id, prenom, nom, departement");
  const today = new Date().toISOString().slice(0, 10);

  let inserted = 0;
  let updated = 0;
  let matched = 0;

  for (const item of items) {
    const normalise = normalizePhone(item.numero);
    if (!normalise) continue;

    const match = matchEmploye(item.titulaire, employes ?? []);
    if (match) matched++;

    const payload = {
      numero: formatPhone(normalise),
      numero_normalise: normalise,
      statut: "attribue",
      operateur: "Orange",
      employe_id: match?.id ?? null,
      titulaire_libre: match ? null : item.titulaire,
      fonction: item.fonction || null,
      departement: item.departement || match?.departement || null,
      date_attribution: today,
      source: "import",
    };

    const { data: existing } = await supabase
      .from("numeros_flotte")
      .select("id")
      .eq("numero_normalise", normalise)
      .maybeSingle();

    if (existing) {
      await supabase.from("numeros_flotte").update(payload).eq("id", existing.id);
      updated++;
    } else {
      const { error } = await supabase.from("numeros_flotte").insert(payload);
      if (!error) inserted++;
      else console.error("Erreur", normalise, error.message);
    }
  }

  console.log(`Terminé: ${inserted} créés, ${updated} MAJ, ${matched} liés employés`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
