import { ITSM_STATUTS } from "@/lib/itsm/constants";

/** Parse CSV simple (guillemets + virgules). Suffisant pour exports ManageEngine. */
export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  if (nonEmpty.length === 0) return [];

  const headers = parseCsvLine(nonEmpty[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < nonEmpty.length; i++) {
    const cells = parseCsvLine(nonEmpty[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = cells[j] ?? "";
    }
    rows.push(row);
  }

  return rows;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export function cleanCsvCell(value: unknown) {
  if (value === undefined || value === null) return "";
  const s = String(value).trim();
  return s === "-" ? "" : s;
}

const STATUS_MAP: Record<string, string> = {
  Open: "Ouvert",
  Ouvert: "Ouvert",
  "In Progress": "En cours",
  "En cours": "En cours",
  Resolved: "Résolu",
  Résolu: "Résolu",
  Closed: "Fermé",
  Fermé: "Fermé",
};

export function normalizeTicketStatut(raw: string) {
  const clean = raw.trim();
  if (!clean) return "Ouvert";
  return (
    STATUS_MAP[clean] ??
    (ITSM_STATUTS.includes(clean as (typeof ITSM_STATUTS)[number]) ? clean : "Ouvert")
  );
}
