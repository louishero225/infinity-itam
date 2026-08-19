import { DEFAULT_TECHNICIAN, MANAGEENGINE_CAT_MAP } from "@/lib/itsm/constants";
import { cleanCsvCell, parseCsv, normalizeTicketStatut } from "@/lib/itsm/parse-csv";
import { pad2 } from "@/lib/itsm/sla";

export type ManageEngineTicketInsert = {
  demo: boolean;
  source: "export";
  approx_time: boolean;
  date: string;
  heure_creation: string;
  demandeur: string;
  entite: string;
  categorie: string;
  canal: string;
  sous_canal: string | null;
  ticket_ref: string;
  technicien: string;
  statut: string;
  priorite: string;
  en_retard: boolean;
  resolved_at: string | null;
  description: string | null;
};

export function parseManageEngineCsv(
  csvText: string,
  existingRefs: Set<string>
): ManageEngineTicketInsert[] {
  const rows = parseCsv(csvText);
  const toInsert: ManageEngineTicketInsert[] = [];

  for (const row of rows) {
    const ref = cleanCsvCell(row["Request ID"]);
    if (!ref || existingRefs.has(ref)) continue;

    const createdRaw = cleanCsvCell(row["Created Date"]);
    if (!createdRaw) continue;
    const created = new Date(createdRaw);
    if (Number.isNaN(created.getTime())) continue;

    const date = `${created.getFullYear()}-${pad2(created.getMonth() + 1)}-${pad2(created.getDate())}`;
    const heure_creation = `${pad2(created.getHours())}:${pad2(created.getMinutes())}`;

    const catRaw = cleanCsvCell(row["Category"]);
    const resolvedRaw = cleanCsvCell(row["Resolved Time"]);
    let resolved_at: string | null = null;
    if (resolvedRaw) {
      const rd = new Date(resolvedRaw);
      if (!Number.isNaN(rd.getTime())) {
        resolved_at = rd.toISOString();
      }
    }

    toInsert.push({
      demo: false,
      source: "export",
      approx_time: false,
      date,
      heure_creation,
      demandeur: cleanCsvCell(row["Requester Name"]),
      entite: "",
      categorie: MANAGEENGINE_CAT_MAP[catRaw] || (catRaw ? "Autre" : "Non catégorisé"),
      canal: "ManageEngine",
      sous_canal: cleanCsvCell(row["Mode"]) || null,
      ticket_ref: ref,
      technicien: cleanCsvCell(row["Technician"]) || DEFAULT_TECHNICIAN,
      statut: normalizeTicketStatut(cleanCsvCell(row["Status"])),
      priorite: cleanCsvCell(row["Priority"]) || "Non défini",
      en_retard: cleanCsvCell(row["Is Overdue"]) === "True",
      resolved_at,
      description: cleanCsvCell(row["Subject"]) || null,
    });

    existingRefs.add(ref);
  }

  return toInsert;
}
