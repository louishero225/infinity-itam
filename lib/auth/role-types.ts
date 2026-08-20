export type RoleCode = "admin" | "itam" | "lecture" | "collaborateur";

export const ROLE_CODES: RoleCode[] = ["admin", "itam", "lecture", "collaborateur"];

export const ROLE_LABELS: Record<RoleCode, string> = {
  admin: "Administrateur",
  itam: "IT / Support",
  lecture: "Lecture seule",
  collaborateur: "Collaborateur",
};

export function isRoleCode(value: string): value is RoleCode {
  return ROLE_CODES.includes(value as RoleCode);
}

/** Accès au parc ITAM (matériel, attributions, etc.) */
export function isStaffRole(roles: RoleCode[]) {
  return roles.some((r) => r === "admin" || r === "itam" || r === "lecture");
}

/** Peut créer / traiter des tickets côté équipe IT */
export function canWriteItsm(roles: RoleCode[]) {
  return roles.some((r) => r === "admin" || r === "itam");
}

/** Peut soumettre une demande via le portail */
export function canRequestTicket(roles: RoleCode[]) {
  return (
    roles.length === 0 ||
    roles.some((r) => r === "admin" || r === "itam" || r === "collaborateur" || r === "lecture")
  );
}
