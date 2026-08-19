#!/usr/bin/env node
/**
 * Applique une migration SQL locale via connexion Postgres directe.
 *
 * Prérequis dans .env.local :
 *   SUPABASE_DB_URL=postgresql://postgres.[ref]:[password]@...pooler.supabase.com:6543/postgres
 *
 * Usage:
 *   node scripts/apply-sql-migration.mjs supabase/migrations/20260819_08_itsm_personnes_employes.sql
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationArg = process.argv[2];

if (!migrationArg) {
  console.error("Usage: node scripts/apply-sql-migration.mjs <fichier.sql>");
  process.exit(1);
}

const env = readFileSync(join(ROOT, ".env.local"), "utf8");
const pick = (n) => env.match(new RegExp(`^${n}=(.+)$`, "m"))?.[1]?.trim();
const dbUrl = pick("SUPABASE_DB_URL") ?? pick("DATABASE_URL");

if (!dbUrl) {
  console.error(
    "SUPABASE_DB_URL ou DATABASE_URL manquant dans .env.local.\n" +
      "Récupérez l'URL dans Supabase → Project Settings → Database → Connection string (pooler).\n" +
      "Sinon, exécutez le SQL manuellement dans le SQL Editor :\n" +
      `  ${migrationArg}`
  );
  process.exit(1);
}

const sql = readFileSync(join(ROOT, migrationArg), "utf8");

async function main() {
  const pg = await import("pg");
  const client = new pg.default.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log(`✓ Migration appliquée : ${migrationArg}`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
