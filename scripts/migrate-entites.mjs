#!/usr/bin/env node
/**
 * Migration des attributions existantes vers le référentiel entites.
 * Crée les entités manquantes et remplit entite_id sur les attributions non-employé.
 *
 * Usage: node scripts/migrate-entites.mjs [--execute]
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const EXECUTE = process.argv.includes("--execute");

function loadEnv() {
  const envPath = join(ROOT, ".env.local");
  const content = readFileSync(envPath, "utf8");
  const url = content.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.trim();
  const key = content.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)$/m)?.[1]?.trim();
  if (!url || !key) throw new Error("Variables Supabase manquantes dans .env.local");
  return { url, key };
}

function normalize(str) {
  return String(str ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function entiteCodeFromNom(nom) {
  const n = nom.trim();
  const upper = n.toUpperCase();
  if (/^[A-Z0-9-]{2,12}$/.test(upper.replace(/\s/g, ""))) {
    return upper.replace(/\s/g, "").slice(0, 20);
  }
  const key = normalize(n)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 24);
  return (key || "entite").toUpperCase();
}

async function main() {
  const { url, key } = loadEnv();
  const supabase = createClient(url, key);

  const { data: entites, error: entError } = await supabase.from("entites").select("*");
  if (entError) {
    console.error(
      "❌ Table entites introuvable. Exécutez d'abord la migration SQL:\n" +
        "   supabase/migrations/20260729_add_entites.sql"
    );
    process.exit(1);
  }

  const entiteList = [...(entites ?? [])];
  const findEntite = (nom) =>
    entiteList.find(
      (e) => normalize(e.nom) === normalize(nom) || normalize(e.code) === normalize(entiteCodeFromNom(nom))
    );

  const { data: attributions, error: attrError } = await supabase
    .from("attributions")
    .select("id, beneficiaire_type, beneficiaire_label, entite_id, employe_id")
    .in("beneficiaire_type", ["departement", "societe", "site"])
    .is("entite_id", null);

  if (attrError) throw new Error(attrError.message);

  const toMigrate = (attributions ?? []).filter(
    (a) => a.beneficiaire_label && a.beneficiaire_label !== "Employé"
  );

  console.log(`Attributions entité sans entite_id : ${toMigrate.length}`);
  if (!EXECUTE) {
    console.log("\nDry-run — relancez avec --execute pour appliquer.");
    for (const a of toMigrate.slice(0, 20)) {
      console.log(`  • ${a.beneficiaire_type}: ${a.beneficiaire_label}`);
    }
    return;
  }

  let updated = 0;
  for (const a of toMigrate) {
    const label = a.beneficiaire_label.trim();
    let entite = findEntite(label);

    if (!entite) {
      const code = entiteCodeFromNom(label);
      const type = a.beneficiaire_type === "societe" ? "societe" : a.beneficiaire_type ?? "departement";
      const { data, error } = await supabase
        .from("entites")
        .insert({ code, nom: label, type, actif: true })
        .select("*")
        .single();
      if (error && error.code !== "23505") {
        console.error(`Erreur création entité ${label}:`, error.message);
        continue;
      }
      entite = data ?? findEntite(label);
      if (entite && !entiteList.some((e) => e.id === entite.id)) entiteList.push(entite);
    }

    if (!entite) continue;

    const { error: upError } = await supabase
      .from("attributions")
      .update({ entite_id: entite.id, beneficiaire_label: entite.nom })
      .eq("id", a.id);

    if (upError) {
      console.error(`Erreur MAJ attribution ${a.id}:`, upError.message);
    } else {
      updated++;
    }
  }

  console.log(`✅ ${updated} attribution(s) migrée(s) vers entites`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
