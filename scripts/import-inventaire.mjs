#!/usr/bin/env node
/**
 * Import inventaire Excel → Supabase (option B : sync intelligente)
 *
 * Usage:
 *   node scripts/import-inventaire.mjs                  # dry-run (défaut)
 *   node scripts/import-inventaire.mjs --execute        # applique en base
 *   node scripts/import-inventaire.mjs --file "path.xlsx"
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const DEFAULT_FILE = join(ROOT, "Inventaire materiel IAG a jour.xlsx");
const SKIP_SHEETS = new Set(["Synthèse", "Synthese"]);
const HEADER_MARKER = "Référence ITAM";

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
  const key = content.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)$/m)?.[1]?.trim();
  if (!url || !key) throw new Error("Variables Supabase manquantes dans .env.local");
  return { url, key };
}

function normalize(str) {
  return (str ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSerial(str) {
  return normalize(str).replace(/[^a-z0-9]/g, "");
}

function normalizeCode(str) {
  return (str ?? "").trim().toUpperCase();
}

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value)) {
    return value.toISOString().slice(0, 10);
  }
  const s = String(value).trim();
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return null;
}

function parseCost(value) {
  if (value === "" || value == null) return null;
  const n = Number(String(value).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseEmployeeName(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) return { prenom: parts[0], nom: "—" };
  return { prenom: parts.slice(0, -1).join(" "), nom: parts[parts.length - 1] };
}

function mapEtat(excelEtat, utilisateur, departement) {
  const e = normalize(excelEtat);
  let statut = "Stock";
  let etat = "Bon";

  if (e.includes("defaillant") || e.includes("reviser") || e.includes("a reviser")) {
    statut = "Maintenance";
    etat = "À réparer";
  } else if (e.includes("hors service")) {
    statut = "Maintenance";
    etat = "Hors service";
  } else if (e.includes("en service")) {
    statut = utilisateur?.trim() || departement?.trim() ? "Attribué" : "Stock";
    etat = "Bon";
  } else if (e.includes("disponible")) {
    statut = "Stock";
    etat = "Bon";
  } else if (e.includes("maintenance") || e.includes("transit")) {
    statut = e.includes("transit") ? "Transit" : "Maintenance";
  }

  return { statut, etat };
}

function buildObservations(finGarantie, observations) {
  const parts = [];
  if (finGarantie) {
    const d = parseDate(finGarantie);
    parts.push(`Fin de garantie: ${d ?? finGarantie}`);
  }
  if (observations?.trim()) parts.push(observations.trim());
  return parts.length ? parts.join("\n") : null;
}

function parseExcel(filePath) {
  const wb = XLSX.readFile(filePath);
  const rows = [];

  for (const sheetName of wb.SheetNames) {
    if (SKIP_SHEETS.has(sheetName)) continue;

    const sheet = wb.Sheets[sheetName];
    const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    let headerIdx = -1;
    for (let i = 0; i < Math.min(raw.length, 10); i++) {
      if (raw[i].some((c) => String(c).includes(HEADER_MARKER))) {
        headerIdx = i;
        break;
      }
    }
    if (headerIdx < 0) {
      console.warn(`⚠ Onglet "${sheetName}" : en-tête introuvable, ignoré`);
      continue;
    }

    const headers = raw[headerIdx].map((h) => String(h).trim());
    const col = (name) => headers.findIndex((h) => h.includes(name));

    const idx = {
      categorie: col("Catégorie") >= 0 ? col("Catégorie") : col("Categorie"),
      modele: col("Désignation") >= 0 ? col("Désignation") : col("Designation"),
      marque: col("Marque"),
      code: col("Référence ITAM") >= 0 ? col("Référence ITAM") : col("Reference ITAM"),
      serie: col("N° de série") >= 0 ? col("N° de série") : col("serie"),
      etat: col("État") >= 0 ? col("État") : col("Etat"),
      utilisateur: col("Utilisateur"),
      departement: col("Département") >= 0 ? col("Département") : col("Departement"),
      dateAchat: col("Date acquisition"),
      cout: col("Coût") >= 0 ? col("Coût") : col("Cout"),
      garantie: col("Fin de garantie"),
      observations: col("Observations"),
    };

    for (let i = headerIdx + 1; i < raw.length; i++) {
      const r = raw[i];
      const code = String(r[idx.code] ?? "").trim();
      if (!code || code === HEADER_MARKER) continue;

      rows.push({
        sheet: sheetName,
        type: String(r[idx.categorie] ?? sheetName).trim() || sheetName,
        modele: String(r[idx.modele] ?? "").trim() || null,
        marque: String(r[idx.marque] ?? "").trim() || null,
        code_materiel: normalizeMaterielCode(normalizeCode(code)),
        numero_serie: String(r[idx.serie] ?? "").trim() || null,
        excel_etat: String(r[idx.etat] ?? "").trim(),
        utilisateur: String(r[idx.utilisateur] ?? "").trim() || null,
        departement: String(r[idx.departement] ?? "").trim() || null,
        date_achat: parseDate(r[idx.dateAchat]),
        cout: parseCost(r[idx.cout]),
        observations: buildObservations(r[idx.garantie], r[idx.observations]),
      });
    }
  }

  return rows;
}

function matchEmploye(name, employes) {
  if (!name?.trim()) return null;
  const n = normalize(name);

  for (const e of employes) {
    const variants = [`${e.prenom} ${e.nom}`, `${e.nom} ${e.prenom}`].map(normalize);
    if (variants.includes(n)) return e;
  }

  const tokens = n.split(/\s+/).filter((t) => t.length > 1);
  if (tokens.length >= 2) {
    const nomLast = tokens[tokens.length - 1];
    for (const e of employes) {
      if (normalize(e.nom) === nomLast) {
        const prenomNorm = normalize(e.prenom);
        const otherTokens = tokens.slice(0, -1);
        if (otherTokens.every((t) => prenomNorm.includes(t) || t.includes(prenomNorm.split(" ")[0]))) {
          return e;
        }
      }
    }
  }

  for (const e of employes) {
    const full = normalize(`${e.prenom} ${e.nom}`);
    const nomNorm = normalize(e.nom);
    if (tokens.includes(nomNorm) && tokens.filter((t) => t !== nomNorm).every((t) => full.includes(t))) {
      return e;
    }
  }

  return null;
}

function findMateriel(row, byCode, bySerie) {
  const code = normalizeCode(row.code_materiel);
  if (byCode.has(code)) {
    return { materiel: byCode.get(code), matchBy: "code" };
  }

  const serie = normalizeSerial(row.numero_serie);
  if (serie && bySerie.has(serie)) {
    return { materiel: bySerie.get(serie), matchBy: "serie" };
  }

  return { materiel: null, matchBy: null };
}

function normalizeMaterielType(type) {
  const key = normalize(type ?? "");
  if (key === "telephone" || key === "smartphone") return "Smartphone";
  if (key === "ordinateur portable") return "Ordinateur Portable";
  if (key === "ordinateur fixe") return "Ordinateur Fixe";
  return (type ?? "").trim();
}

function normalizeMaterielCode(code) {
  const c = (code ?? "").trim().toUpperCase();
  if (c.startsWith("IAG-")) return c;
  const m = c.match(/^(PC|TEL|MON|IMP|PER|NET)-(.+)$/);
  if (!m) return c;
  return `IAG-${m[1]}-${m[2]}`;
}

function materielPayload(row) {
  const { statut, etat } = mapEtat(row.excel_etat, row.utilisateur, row.departement);
  return {
    code_materiel: normalizeMaterielCode(row.code_materiel),
    type: normalizeMaterielType(row.type),
    marque: row.marque,
    modele: row.modele,
    numero_serie: row.numero_serie,
    statut,
    etat,
    date_achat: row.date_achat,
    cout: row.cout,
    observations: row.observations,
    nom_device: row.modele ? `${row.marque ?? ""} ${row.modele}`.trim() : null,
  };
}

function reconcile(excelRows, dbMateriels, dbEmployes, dbAttributions) {
  const byCode = new Map(dbMateriels.map((m) => [normalizeCode(m.code_materiel), m]));
  const bySerie = new Map();
  for (const m of dbMateriels) {
    const s = normalizeSerial(m.numero_serie);
    if (s) bySerie.set(s, m);
  }

  const matchedDbIds = new Set();
  const plan = {
    create: [],
    update: [],
    codeMigration: [],
    attributionsCreate: [],
    attributionsClose: [],
    employesCreate: [],
    orphans: [],
    warnings: [],
    skippedDuplicates: [],
  };

  const employesWorking = [...dbEmployes];
  const seenCodes = new Map();
  const seenSeries = new Map();

  for (const row of excelRows) {
    if (seenCodes.has(row.code_materiel)) {
      plan.skippedDuplicates.push({ code: row.code_materiel, sheet: row.sheet });
      continue;
    }
    seenCodes.set(row.code_materiel, row);

    const serieKey = normalizeSerial(row.numero_serie);
    if (serieKey && seenSeries.has(serieKey)) {
      plan.warnings.push(`Série dupliquée dans Excel: ${row.numero_serie} (${row.code_materiel})`);
    }
    if (serieKey) seenSeries.set(serieKey, row.code_materiel);

    const { materiel, matchBy } = findMateriel(row, byCode, bySerie);
    const payload = materielPayload(row);

    if (!materiel) {
      plan.create.push({ row, payload });
    } else {
      matchedDbIds.add(materiel.id);
      const oldCode = normalizeCode(materiel.code_materiel);
      if (matchBy === "serie" && oldCode !== row.code_materiel) {
        plan.codeMigration.push({
          id: materiel.id,
          oldCode: materiel.code_materiel,
          newCode: row.code_materiel,
          row,
          payload,
        });
      } else {
        plan.update.push({ id: materiel.id, oldCode: materiel.code_materiel, row, payload });
      }
    }

    const { statut } = payload;
    const activeAttr = dbAttributions.filter((a) => a.materiel_id === materiel?.id);

    if (statut === "Attribué") {
      if (row.utilisateur && !matchEmploye(row.utilisateur, employesWorking)) {
        const parsed = parseEmployeeName(row.utilisateur);
        plan.employesCreate.push({
          key: normalize(row.utilisateur),
          prenom: parsed.prenom,
          nom: parsed.nom,
          departement: row.departement || "IAG",
          excelName: row.utilisateur,
        });
      }

      plan.attributionsCreate.push({
        materielId: materiel?.id ?? null,
        code_materiel: row.code_materiel,
        row,
        employeName: row.utilisateur,
        departement: row.departement,
      });

      for (const a of activeAttr) {
        plan.attributionsClose.push({
          id: a.id,
          materiel_id: a.materiel_id,
          reason: "Réconciliation import inventaire 2026",
        });
      }
    } else if (materiel) {
      for (const a of activeAttr) {
        plan.attributionsClose.push({
          id: a.id,
          materiel_id: a.materiel_id,
          reason: "Matériel passé en stock/maintenance (inventaire 2026)",
        });
      }
    }
  }

  const empMap = new Map();
  for (const e of plan.employesCreate) {
    if (!empMap.has(e.key)) empMap.set(e.key, e);
  }
  plan.employesCreate = [...empMap.values()];

  for (const m of dbMateriels) {
    if (!matchedDbIds.has(m.id)) {
      plan.orphans.push({
        id: m.id,
        code_materiel: m.code_materiel,
        type: m.type,
        numero_serie: m.numero_serie,
      });
    }
  }

  return plan;
}

async function loadDatabase(supabase) {
  const [materiels, employes, attributions] = await Promise.all([
    supabase.from("materiels").select("*"),
    supabase.from("employes").select("*"),
    supabase.from("attributions").select("*").eq("statut", "Actif"),
  ]);

  if (materiels.error) throw new Error(materiels.error.message);
  if (employes.error) throw new Error(employes.error.message);
  if (attributions.error) throw new Error(attributions.error.message);

  return {
    materiels: materiels.data ?? [],
    employes: employes.data ?? [],
    attributions: attributions.data ?? [],
  };
}

async function executePlan(supabase, plan) {
  const report = { errors: [], created: {}, updated: 0, closed: 0 };
  const today = new Date().toISOString().slice(0, 10);

  const db = await loadDatabase(supabase);
  const reportsDir = join(ROOT, "scripts", "reports");
  mkdirSync(reportsDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  writeFileSync(join(reportsDir, `backup-${ts}.json`), JSON.stringify(db, null, 2));

  let employes = [...db.employes];
  report.created.employes = 0;
  for (const e of plan.employesCreate) {
    const { data, error } = await supabase
      .from("employes")
      .insert({
        prenom: e.prenom,
        nom: e.nom,
        departement: e.departement,
        statut: "Actif",
      })
      .select("*")
      .single();
    if (error) {
      report.errors.push(`Employé ${e.excelName}: ${error.message}`);
    } else {
      employes.push(data);
      report.created.employes++;
    }
  }

  const matchEmp = (name) => matchEmploye(name, employes);

  report.created.materiels = 0;
  const codeToId = new Map(db.materiels.map((m) => [normalizeCode(m.code_materiel), m.id]));

  for (const { row, payload } of plan.create) {
    const { data, error } = await supabase.from("materiels").insert(payload).select("id").single();
    if (error) {
      report.errors.push(`Création ${row.code_materiel}: ${error.message}`);
    } else {
      codeToId.set(normalizeCode(row.code_materiel), data.id);
      report.created.materiels++;
    }
  }

  for (const item of plan.codeMigration) {
    const { error } = await supabase
      .from("materiels")
      .update({ ...item.payload, code_materiel: item.newCode })
      .eq("id", item.id);
    if (error) report.errors.push(`Migration code ${item.oldCode}→${item.newCode}: ${error.message}`);
    else {
      codeToId.set(normalizeCode(item.newCode), item.id);
      report.updated++;
    }
  }

  for (const item of plan.update) {
    const { error } = await supabase.from("materiels").update(item.payload).eq("id", item.id);
    if (error) report.errors.push(`MAJ ${item.oldCode}: ${error.message}`);
    else report.updated++;
  }

  report.orphans = 0;
  for (const o of plan.orphans) {
    const m = db.materiels.find((x) => x.id === o.id);
    const note = "[Import 2026] Absent de l'inventaire Excel — à vérifier";
    const obs = m?.observations ? `${note}\n${m.observations}` : note;
    const { error } = await supabase
      .from("materiels")
      .update({ observations: obs, etat: "Hors service" })
      .eq("id", o.id);
    if (error) report.errors.push(`Orphelin ${o.code_materiel}: ${error.message}`);
    else report.orphans++;
  }

  const toClose = new Map(plan.attributionsClose.map((a) => [a.id, a]));
  for (const a of toClose.values()) {
    const { error } = await supabase
      .from("attributions")
      .update({
        statut: "Restitué",
        date_restitution: today,
        commentaire: a.reason,
      })
      .eq("id", a.id);
    if (error) report.errors.push(`Clôture attribution ${a.id}: ${error.message}`);
    else report.closed++;
  }

  const { data: allMateriels } = await supabase.from("materiels").select("id, code_materiel");
  for (const m of allMateriels ?? []) {
    codeToId.set(normalizeCode(m.code_materiel), m.id);
  }

  report.created.attributions = 0;
  const processedCodes = new Set();

  for (const attr of plan.attributionsCreate) {
    if (processedCodes.has(attr.code_materiel)) continue;
    processedCodes.add(attr.code_materiel);

    const materielId = codeToId.get(normalizeCode(attr.code_materiel));
    if (!materielId) continue;

    const payload = materielPayload(attr.row);
    if (payload.statut !== "Attribué") continue;

    let employe_id = null;
    let beneficiaire_type = "departement";
    let beneficiaire_label = attr.departement || "IAG";

    if (attr.employeName) {
      const emp = matchEmp(attr.employeName);
      if (emp) {
        employe_id = emp.id;
        beneficiaire_type = "employe";
        beneficiaire_label = "Employé";
      } else {
        continue;
      }
    } else if (!attr.departement) {
      continue;
    }

    const { data: numero } = await supabase.rpc("generate_numero_attribution");

    const { error } = await supabase.from("attributions").insert({
      materiel_id: materielId,
      employe_id,
      date_attribution: attr.row.date_achat ?? today,
      statut: "Actif",
      numero_attribution: numero ?? undefined,
      beneficiaire_type,
      beneficiaire_label,
      commentaire: "Import inventaire IAG 2026",
    });

    if (error) {
      report.errors.push(`Attribution ${attr.code_materiel}: ${error.message}`);
    } else {
      await supabase.from("materiels").update({ statut: "Attribué" }).eq("id", materielId);
      report.created.attributions++;
    }
  }

  return report;
}

function printReport(plan, excelRows, db) {
  console.log("\n══════════════════════════════════════════════════");
  console.log("  RAPPORT DE RÉCONCILIATION — Import Inventaire IAG");
  console.log("══════════════════════════════════════════════════\n");
  console.log(`Mode          : ${EXECUTE ? "⚡ EXÉCUTION" : "🔍 DRY-RUN (simulation)"}`);
  console.log(`Fichier       : ${FILE}`);
  console.log(`Lignes Excel  : ${excelRows.length}`);
  console.log(`Base actuelle : ${db.materiels.length} matériels, ${db.employes.length} employés, ${db.attributions.length} attributions actives\n`);

  console.log("── Actions prévues ──");
  console.log(`  ➕ Matériels à créer       : ${plan.create.length}`);
  console.log(`  ✏️  Matériels à mettre à jour : ${plan.update.length}`);
  console.log(`  🔄 Codes à migrer (série)  : ${plan.codeMigration.length}`);
  console.log(`  👤 Employés à créer        : ${plan.employesCreate.length}`);
  console.log(`  📋 Attributions à créer    : ${plan.attributionsCreate.filter((a) => materielPayload(a.row).statut === "Attribué").length}`);
  console.log(`  🔒 Attributions à clôturer : ${new Set(plan.attributionsClose.map((a) => a.id)).size}`);
  console.log(`  ⚠️  Orphelins (base seule)  : ${plan.orphans.length}`);
  console.log(`  ⛔ Doublons Excel ignorés  : ${plan.skippedDuplicates.length}`);

  if (plan.codeMigration.length) {
    console.log("\n── Migrations de code (match par n° série) ──");
    for (const m of plan.codeMigration.slice(0, 10)) {
      console.log(`  ${m.oldCode} → ${m.newCode} (${m.row.numero_serie})`);
    }
    if (plan.codeMigration.length > 10) console.log(`  … et ${plan.codeMigration.length - 10} autres`);
  }

  if (plan.employesCreate.length) {
    console.log("\n── Nouveaux employés ──");
    for (const e of plan.employesCreate.slice(0, 15)) {
      console.log(`  ${e.excelName} → ${e.prenom} ${e.nom} (${e.departement})`);
    }
    if (plan.employesCreate.length > 15) console.log(`  … et ${plan.employesCreate.length - 15} autres`);
  }

  if (plan.orphans.length) {
    console.log("\n── Orphelins (absents Excel → marqués « à vérifier ») ──");
    for (const o of plan.orphans.slice(0, 10)) {
      console.log(`  ${o.code_materiel} (${o.type})`);
    }
    if (plan.orphans.length > 10) console.log(`  … et ${plan.orphans.length - 10} autres`);
  }

  if (plan.warnings.length) {
    console.log("\n── Avertissements ──");
    for (const w of plan.warnings.slice(0, 10)) console.log(`  ⚠ ${w}`);
  }

  console.log("\n══════════════════════════════════════════════════\n");
}

async function main() {
  if (!existsSync(FILE)) {
    console.error(`Fichier introuvable : ${FILE}`);
    process.exit(1);
  }

  console.log("Lecture du fichier Excel…");
  const excelRows = parseExcel(FILE);
  console.log(`${excelRows.length} lignes extraites.`);

  const { url, key } = loadEnv();
  const supabase = createClient(url, key);

  console.log("Chargement de la base…");
  const db = await loadDatabase(supabase);

  const plan = reconcile(excelRows, db.materiels, db.employes, db.attributions);

  const reportsDir = join(ROOT, "scripts", "reports");
  mkdirSync(reportsDir, { recursive: true });
  const reportPath = join(reportsDir, `reconciliation-${Date.now()}.json`);
  writeFileSync(
    reportPath,
    JSON.stringify(
      {
        summary: {
          excel: excelRows.length,
          create: plan.create.length,
          update: plan.update.length,
          codeMigration: plan.codeMigration.length,
          employesCreate: plan.employesCreate.length,
          orphans: plan.orphans.length,
        },
        plan,
      },
      null,
      2
    )
  );
  console.log(`Rapport JSON : ${reportPath}`);

  printReport(plan, excelRows, db);

  if (!EXECUTE) {
    console.log("Pour appliquer : node scripts/import-inventaire.mjs --execute\n");
    return;
  }

  console.log("Application en base…\n");
  const result = await executePlan(supabase, plan);

  console.log("── Résultat ──");
  console.log(`  Employés créés     : ${result.created.employes}`);
  console.log(`  Matériels créés    : ${result.created.materiels}`);
  console.log(`  Matériels MAJ      : ${result.updated}`);
  console.log(`  Orphelins traités  : ${result.orphans}`);
  console.log(`  Attributions créées: ${result.created.attributions}`);
  console.log(`  Attributions closes: ${result.closed}`);

  if (result.errors.length) {
    console.log(`\n❌ ${result.errors.length} erreur(s) :`);
    for (const e of result.errors.slice(0, 20)) console.log(`  - ${e}`);
  } else {
    console.log("\n✅ Import terminé sans erreur.");
  }

  const after = await loadDatabase(supabase);
  console.log(
    `\nBase après import : ${after.materiels.length} matériels, ${after.employes.length} employés, ${after.attributions.length} attributions actives`
  );
}

main().catch((err) => {
  console.error("Erreur fatale:", err.message);
  process.exit(1);
});
