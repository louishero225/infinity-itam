/** Normalise un numéro CI (10 chiffres, commence par 07). */
export function normalizePhoneDigits(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("07")) return digits;
  if (digits.length === 12 && digits.startsWith("22507")) return digits.slice(3);
  if (digits.length === 13 && digits.startsWith("0022507")) return digits.slice(5);
  return null;
}

/** Affichage « 07 XX XX XX XX » */
export function formatPhoneDisplay(normalised: string) {
  const d = normalizePhoneDigits(normalised) ?? normalised.replace(/\D/g, "");
  if (d.length !== 10) return normalised.trim();
  return `${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 6)} ${d.slice(6, 8)} ${d.slice(8, 10)}`;
}

/** Parse une ligne Excel « Nom Prénom(s) » → tokens pour matching */
export function parseExcelPersonName(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) return { nom: parts[0], prenom: "" };
  return { nom: parts[0], prenom: parts.slice(1).join(" ") };
}
