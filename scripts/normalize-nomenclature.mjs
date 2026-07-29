#!/usr/bin/env node
/**
 * Uniformise types (Téléphone → Smartphone) et codes (PC-xxx → IAG-PC-xxx).
 *
 * Usage:
 *   node scripts/normalize-nomenclature.mjs           # dry-run
 *   node scripts/normalize-nomenclature.mjs --execute
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const EXECUTE = process.argv.includes("--execute");

const CODE_PREFIX_MAP = {
  PC: "IAG-PC",
  TEL: "IAG-TEL",
  MON: "IAG-MON",
  IMP: "IAG-IMP",
  PER: "IAG-PER",
  NET: "IAG-NET",
};

function loadEnv() {
  const content = readFileSync(join(ROOT, ".env.local"), "utf8");
  const url = content.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim();
  const key = content.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)$/m)?.[1]?.trim();
  if (!url || !key) throw new Error("Variables Supabase manquantes");
  return { url, key };
}

function normalizeKey(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeType(type) {
  const key = normalizeKey(type ?? "");
  if (["telephone", "smartphone"].includes(key)) return "Smartphone";
  if (key === "ordinateur portable") return "Ordinateur Portable";
  if (key === "ordinateur fixe") return "Ordinateur Fixe";
  return type?.trim() ?? type;
}

function toIagCode(code) {
  const c = code.trim().toUpperCase();
  if (c.startsWith("IAG-")) return c;
  const m = c.match(/^(PC|TEL|MON|IMP|PER|NET)-(.+)$/);
  if (!m) return c;
  return `${CODE_PREFIX_MAP[m[1]]}-${m[2]}`;
}

function isLegacyCode(code) {
  const c = code.trim().toUpperCase();
  return !c.startsWith("IAG-") && /^(PC|TEL|MON|IMP|PER|NET)-/.test(c);
}

async function main() {
  const supabase = createClient(loadEnv().url, loadEnv().key);

  const { data: materiels, error } = await supabase.from("materiels").select("*");
  if (error) throw new Error(error.message);

  const byCode = new Map(materiels.map((m) => [m.code_materiel.toUpperCase(), m]));

  const typeUpdates = [];
  const codeUpdates = [];
  const toDelete = [];

  for (const m of materiels) {
    const newType = normalizeType(m.type);
    if (newType !== m.type) {
      typeUpdates.push({ id: m.id, from: m.type, to: newType, code: m.code_materiel });
    }

    if (!isLegacyCode(m.code_materiel)) continue;

    const newCode = toIagCode(m.code_materiel);
    const conflict = byCode.get(newCode);

    if (conflict && conflict.id !== m.id) {
      toDelete.push({
        id: m.id,
        code: m.code_materiel,
        duplicateOf: newCode,
        reason: "Doublon legacy — équivalent IAG déjà présent",
      });
    } else if (newCode !== m.code_materiel.toUpperCase()) {
      codeUpdates.push({ id: m.id, from: m.code_materiel, to: newCode });
    }
  }

  console.log("\n══════════════════════════════════════════");
  console.log("  NORMALISATION NOMENCLATURE IAG");
  console.log(`  Mode : ${EXECUTE ? "EXÉCUTION" : "DRY-RUN"}`);
  console.log("══════════════════════════════════════════\n");
  console.log(`Types à corriger     : ${typeUpdates.length}`);
  console.log(`Codes à migrer       : ${codeUpdates.length}`);
  console.log(`Doublons à supprimer : ${toDelete.length}\n`);

  if (typeUpdates.length) {
    console.log("── Types (Téléphone → Smartphone, etc.) ──");
    for (const u of typeUpdates.slice(0, 10)) console.log(`  ${u.code}: "${u.from}" → "${u.to}"`);
    if (typeUpdates.length > 10) console.log(`  … +${typeUpdates.length - 10}`);
  }

  if (codeUpdates.length) {
    console.log("\n── Codes legacy → IAG ──");
    for (const u of codeUpdates) console.log(`  ${u.from} → ${u.to}`);
  }

  if (toDelete.length) {
    console.log("\n── Doublons legacy (suppression) ──");
    for (const d of toDelete) console.log(`  ${d.code} (doublon de ${d.duplicateOf})`);
  }

  if (!EXECUTE) {
    console.log("\nPour appliquer : node scripts/normalize-nomenclature.mjs --execute\n");
    return;
  }

  mkdirSync(join(ROOT, "scripts", "reports"), { recursive: true });
  writeFileSync(
    join(ROOT, "scripts", "reports", `normalize-backup-${Date.now()}.json`),
    JSON.stringify({ typeUpdates, codeUpdates, toDelete }, null, 2)
  );

  let errors = [];

  for (const u of typeUpdates) {
    const { error: e } = await supabase.from("materiels").update({ type: u.to }).eq("id", u.id);
    if (e) errors.push(`Type ${u.code}: ${e.message}`);
  }

  for (const u of codeUpdates) {
    const { error: e } = await supabase
      .from("materiels")
      .update({ code_materiel: u.to })
      .eq("id", u.id);
    if (e) errors.push(`Code ${u.from}: ${e.message}`);
  }

  for (const d of toDelete) {
    await supabase.from("attributions").delete().eq("materiel_id", d.id);
    const { error: e } = await supabase.from("materiels").delete().eq("id", d.id);
    if (e) errors.push(`Suppression ${d.code}: ${e.message}`);
  }

  const { count } = await supabase
    .from("materiels")
    .select("*", { count: "exact", head: true });

  if (errors.length) {
    console.log(`\n❌ ${errors.length} erreur(s)`);
    errors.forEach((e) => console.log(`  - ${e}`));
  } else {
    console.log("\n✅ Normalisation terminée.");
  }
  console.log(`Matériels en base : ${count}`);
}

main().catch((e) => {
  console.error("Erreur:", e.message);
  process.exit(1);
});
