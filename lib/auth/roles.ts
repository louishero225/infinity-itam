import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  canRequestTicket,
  canWriteItsm,
  isRoleCode,
  isStaffRole,
  type RoleCode,
} from "@/lib/auth/role-types";

export type { RoleCode };

export type Access = {
  userId: string;
  email: string | null;
  roles: RoleCode[];
  canWrite: boolean;
  canAdmin: boolean;
  canRequestTicket: boolean;
  isStaff: boolean;
  isCollaborateurOnly: boolean;
};

export async function getAccess(): Promise<Access> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Non authentifié");
  }

  const { data: links, error: rolesError } = await supabase
    .from("comptes_roles")
    .select("role_id")
    .eq("compte_id", user.id);

  const roles: RoleCode[] = [];
  if (!rolesError && (links ?? []).length > 0) {
    const ids = (links ?? []).map((row) => row.role_id);
    const { data: roleRows } = await supabase.from("roles").select("code").in("id", ids);
    for (const row of roleRows ?? []) {
      if (isRoleCode(row.code) && !roles.includes(row.code)) {
        roles.push(row.code);
      }
    }
  }

  // Compte sans rôle assigné : accès staff complet (bootstrap / comptes historiques)
  if (roles.length === 0) {
    return {
      userId: user.id,
      email: user.email ?? null,
      roles: ["admin", "itam"],
      canWrite: true,
      canAdmin: true,
      canRequestTicket: true,
      isStaff: true,
      isCollaborateurOnly: false,
    };
  }

  const canAdmin = roles.includes("admin");
  const canWrite = canAdmin || canWriteItsm(roles);
  const isStaff = isStaffRole(roles);
  const isCollaborateurOnly = roles.includes("collaborateur") && !isStaff && !canAdmin;

  return {
    userId: user.id,
    email: user.email ?? null,
    roles,
    canWrite,
    canAdmin,
    canRequestTicket: canRequestTicket(roles),
    isStaff,
    isCollaborateurOnly,
  };
}

export async function requireWrite() {
  const access = await getAccess();
  if (!access.canWrite) {
    throw new Error("Accès en lecture seule.");
  }
  return access;
}

export async function requireAdmin() {
  const access = await getAccess();
  if (!access.canAdmin) {
    throw new Error("Cette action est réservée aux administrateurs.");
  }
  return access;
}

export async function requireTicketRequest() {
  const access = await getAccess();
  if (!access.canRequestTicket) {
    throw new Error("Vous n'êtes pas autorisé à créer une demande.");
  }
  return access;
}
