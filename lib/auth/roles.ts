import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RoleCode } from "@/lib/auth/role-types";

export type { RoleCode };

export type Access = {
  userId: string;
  email: string | null;
  roles: RoleCode[];
  canWrite: boolean;
  canAdmin: boolean;
};

const ROLE_CODES: RoleCode[] = ["admin", "itam", "lecture"];

function isRoleCode(value: string): value is RoleCode {
  return ROLE_CODES.includes(value as RoleCode);
}

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

  if (roles.length === 0) {
    return {
      userId: user.id,
      email: user.email ?? null,
      roles: ["admin", "itam"],
      canWrite: true,
      canAdmin: true,
    };
  }

  const canAdmin = roles.includes("admin");
  const canWrite = canAdmin || roles.includes("itam");

  return {
    userId: user.id,
    email: user.email ?? null,
    roles,
    canWrite,
    canAdmin,
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
