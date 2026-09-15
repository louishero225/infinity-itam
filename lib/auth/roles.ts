import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

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

/** Une seule résolution d'accès par requête RSC (évite 2–3 appels auth/rôles). */
export const getAccess = cache(async (): Promise<Access> => {
  const supabase = await createSupabaseServerClient();
  let user = null as { id: string; email?: string | null } | null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    const { data: sessionData } = await supabase.auth.getSession();
    user = sessionData.session?.user ?? null;
  } else {
    user = data.user;
  }

  if (!user) {
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

  if (roles.length === 0) {
    return {
      userId: user.id,
      email: user.email ?? null,
      roles: ["collaborateur"],
      canWrite: false,
      canAdmin: false,
      canRequestTicket: true,
      isStaff: false,
      isCollaborateurOnly: true,
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
});

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

/** Pages réservées au staff ITAM / IT (parc, tickets, flotte…). */
export async function getStaffAccess(): Promise<Access> {
  try {
    const access = await getAccess();
    if (access.isCollaborateurOnly || (!access.isStaff && !access.canAdmin)) {
      redirect("/mes-demandes");
    }
    return access;
  } catch {
    redirect("/login");
  }
}

/** Pages réservées aux administrateurs. */
export async function getAdminAccess(): Promise<Access> {
  const access = await getStaffAccess();
  if (!access.canAdmin) {
    redirect("/dashboard");
  }
  return access;
}
