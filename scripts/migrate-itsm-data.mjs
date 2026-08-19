#!/usr/bin/env node
/**
 * Migre les données ITSM depuis l'ancien Supabase (iag-support-it)
 * vers le Supabase Infinity ITAM.
 *
 * Usage:
 *   node scripts/migrate-itsm-data.mjs           # dry-run
 *   node scripts/migrate-itsm-data.mjs --execute # applique
 *
 * Variables optionnelles dans .env.local :
 *   LEGACY_SUPABASE_URL
 *   LEGACY_SUPABASE_KEY   (anon ou publishable — lecture seule suffit)
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const EXECUTE = process.argv.includes("--execute");

const DEFAULT_LEGACY_URL = "https://mcdoybrdszdcczwzrexb.supabase.co";
const DEFAULT_LEGACY_KEY = "sb_publishable_CPHHPyr_hl6ZOEkN81YpkA_PYO7f2Y4";

function loadEnvFile() {
  const envPath = join(ROOT, ".env.local");
  try {
    return readFileSync(envPath, "utf8");
  } catch {
    throw new Error(".env.local introuvable");
  }
}

function loadConfig() {
  const content = loadEnvFile();
  const pick = (name) => content.match(new RegExp(`^${name}=(.+)$`, "m"))?.[1]?.trim();

  const targetUrl = pick("NEXT_PUBLIC_SUPABASE_URL");
  const targetKey = pick("SUPABASE_SERVICE_ROLE_KEY") ?? pick("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const legacyUrl = pick("LEGACY_SUPABASE_URL") ?? DEFAULT_LEGACY_URL;
  const legacyKey = pick("LEGACY_SUPABASE_KEY") ?? DEFAULT_LEGACY_KEY;

  if (!targetUrl || !targetKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env.local");
  }

  return { targetUrl, targetKey, legacyUrl, legacyKey };
}

function normalizeTicket(row) {
  return {
    id: row.id,
    demo: row.demo ?? false,
    source: row.source === "export" ? "export" : "saisie",
    approx_time: row.approx_time ?? false,
    date: row.date,
    heure_creation: String(row.heure_creation ?? "00:00").slice(0, 8),
    demandeur: row.demandeur ?? "Inconnu",
    entite: row.entite ?? "",
    categorie: row.categorie ?? "Non catégorisé",
    canal: row.canal ?? "",
    sous_canal: row.sous_canal ?? null,
    ticket_ref: row.ticket_ref || null,
    technicien: row.technicien ?? "Guillaume BADOU",
    statut: ["Ouvert", "En cours", "Résolu", "Fermé"].includes(row.statut) ? row.statut : "Ouvert",
    priorite: row.priorite ?? "Non défini",
    en_retard: row.en_retard ?? false,
    resolved_at: row.resolved_at ?? null,
    description: row.description ?? null,
    created_at: row.created_at ?? undefined,
  };
}

async function fetchAll(supabase, table, select = "*") {
  const pageSize = 1000;
  let from = 0;
  const all = [];

  while (true) {
    const { data, error } = await supabase.from(table).select(select).range(from, from + pageSize - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return all;
}

async function main() {
  const { targetUrl, targetKey, legacyUrl, legacyKey } = loadConfig();

  console.log("Source :", legacyUrl);
  console.log("Cible  :", targetUrl);
  console.log(EXECUTE ? "Mode : EXÉCUTION\n" : "Mode : DRY-RUN (ajoutez --execute)\n");

  const legacy = createClient(legacyUrl, legacyKey, { auth: { persistSession: false } });
  const target = createClient(targetUrl, targetKey, { auth: { persistSession: false } });

  const { error: probeError } = await target.from("tickets").select("id").limit(1);
  if (probeError) {
    console.error(
      "❌ Table tickets absente sur la cible. Exécutez d'abord :\n" +
        "   supabase/migrations/20260819_07_itsm_tables_and_policies.sql"
    );
    process.exit(1);
  }

  const [legacyTickets, legacyFaits, legacyDemandeurs] = await Promise.all([
    fetchAll(legacy, "tickets"),
    fetchAll(legacy, "faits_marquants"),
    fetchAll(legacy, "demandeurs"),
  ]);

  console.log(`Tickets source       : ${legacyTickets.length}`);
  console.log(`Faits marquants      : ${legacyFaits.length}`);
  console.log(`Demandeurs           : ${legacyDemandeurs.length}`);

  const tickets = legacyTickets.map(normalizeTicket);
  const faits = legacyFaits.map((f) => ({
    date: f.date,
    note: f.note ?? "",
    updated_at: f.updated_at ?? new Date().toISOString(),
  }));
  const demandeurs = legacyDemandeurs.map((d) => ({
    name: d.name,
    source: d.source ?? "export",
    created_at: d.created_at ?? undefined,
  }));

  if (!EXECUTE) {
    console.log("\nAperçu premier ticket :", tickets[0]?.ticket_ref, tickets[0]?.demandeur);
    console.log("Relancez avec --execute pour importer.");
    return;
  }

  // Demandeurs d'abord
  if (demandeurs.length) {
    const { error } = await target.from("demandeurs").upsert(demandeurs, { onConflict: "name" });
    if (error) throw new Error(`demandeurs: ${error.message}`);
    console.log(`✓ ${demandeurs.length} demandeur(s) importé(s)`);
  }

  // Faits marquants
  if (faits.length) {
    const { error } = await target.from("faits_marquants").upsert(faits, { onConflict: "date" });
    if (error) throw new Error(`faits_marquants: ${error.message}`);
    console.log(`✓ ${faits.length} fait(s) marquant(s) importé(s)`);
  }

  // Tickets par lots (conserve les UUID)
  const batchSize = 50;
  let imported = 0;
  for (let i = 0; i < tickets.length; i += batchSize) {
    const batch = tickets.slice(i, i + batchSize);
    const { error } = await target.from("tickets").upsert(batch, { onConflict: "id" });
    if (error) throw new Error(`tickets lot ${i}: ${error.message}`);
    imported += batch.length;
    process.stdout.write(`\rTickets : ${imported}/${tickets.length}`);
  }
  console.log(`\n✓ ${imported} ticket(s) importé(s)`);

  const { count } = await target.from("tickets").select("*", { count: "exact", head: true });
  console.log(`\nTotal tickets en base cible : ${count ?? "?"}`);
  console.log("Migration terminée.");
}

main().catch((err) => {
  console.error("❌", err.message ?? err);
  process.exit(1);
});
