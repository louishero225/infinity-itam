/** Utilitaires de rapprochement noms employés */

export function normalizeEmployeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function employeDisplayName(prenom: string, nom: string) {
  return `${prenom} ${nom}`.replace(/\s+/g, " ").trim();
}

function employeTokens(prenom: string, nom: string) {
  return [
    ...new Set(
      normalizeEmployeText(`${prenom} ${nom}`)
        .split(" ")
        .filter((t) => t.length > 1)
    ),
  ];
}

/** Score de similarité entre 0 et 1 (tokens communs / plus petit ensemble) */
export function employeSimilarity(
  a: { prenom: string; nom: string },
  b: { prenom: string; nom: string }
) {
  const ta = new Set(employeTokens(a.prenom, a.nom));
  const tb = new Set(employeTokens(b.prenom, b.nom));
  if (ta.size === 0 || tb.size === 0) return 0;

  let common = 0;
  for (const t of ta) {
    if (tb.has(t)) common++;
  }

  return common / Math.min(ta.size, tb.size);
}

export type EmployeDuplicateGroup = {
  key: string;
  members: { id: string; prenom: string; nom: string; departement: string }[];
};

const SIMILARITY_THRESHOLD = 0.75;

export function findDuplicateEmployeGroups(
  employes: { id: string; prenom: string; nom: string; departement: string }[]
) {
  const groups: EmployeDuplicateGroup[] = [];
  const used = new Set<string>();

  for (let i = 0; i < employes.length; i++) {
    if (used.has(employes[i].id)) continue;

    const cluster = [employes[i]];
    for (let j = i + 1; j < employes.length; j++) {
      if (used.has(employes[j].id)) continue;
      if (employeSimilarity(employes[i], employes[j]) >= SIMILARITY_THRESHOLD) {
        cluster.push(employes[j]);
      }
    }

    if (cluster.length > 1) {
      cluster.forEach((e) => used.add(e.id));
      groups.push({
        key: cluster.map((e) => e.id).join("-"),
        members: cluster,
      });
    }
  }

  return groups;
}
