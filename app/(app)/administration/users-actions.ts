"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

import { requireAdmin, getAccess } from "@/lib/auth/roles";
import type { RoleCode } from "@/lib/auth/role-types";
import { logAudit } from "@/lib/server/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type AdminUserRow = {
  id: string;
  email: string;
  created_at: string | null;
  roles: RoleCode[];
  source: "compte" | "auth";
};

const ROLE_CODES: RoleCode[] = ["admin", "itam", "lecture"];

function requireServiceRole() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Configurez SUPABASE_SERVICE_ROLE_KEY (Supabase → Project Settings → API → service_role) dans .env.local et Vercel."
    );
  }
  return createSupabaseServiceClient();
}

async function adminDb(): Promise<SupabaseClient> {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createSupabaseServiceClient();
  }
  return createSupabaseServerClient();
}

async function getRoleIdMap(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("roles").select("id, code");
  if (error) throw new Error(error.message);
  const map = new Map<RoleCode, number>();
  for (const row of data ?? []) {
    if (ROLE_CODES.includes(row.code as RoleCode)) {
      map.set(row.code as RoleCode, row.id);
    }
  }
  return map;
}

async function ensureCompte(
  supabase: SupabaseClient,
  id: string,
  email: string,
  actorId: string
) {
  const { error } = await supabase.from("comptes_systeme").upsert(
    { id, email: email.trim().toLowerCase() },
    { onConflict: "id" }
  );
  if (error) throw new Error(error.message);

  await logAudit({
    action: "compte.upsert",
    entityType: "comptes_systeme",
    entityId: id,
    details: { email, by: actorId },
  });
}

async function replaceRoles(
  supabase: SupabaseClient,
  compteId: string,
  roles: RoleCode[],
  actorId: string,
  email: string
) {
  const unique = Array.from(new Set(roles.filter((r) => ROLE_CODES.includes(r))));
  const roleMap = await getRoleIdMap(supabase);
  const roleIds = unique.map((code) => {
    const id = roleMap.get(code);
    if (!id) throw new Error(`Rôle manquant en base: ${code}. Exécutez la migration rôles.`);
    return id;
  });

  const { error: delError } = await supabase
    .from("comptes_roles")
    .delete()
    .eq("compte_id", compteId);
  if (delError) throw new Error(delError.message);

  if (roleIds.length > 0) {
    const { error: insError } = await supabase.from("comptes_roles").insert(
      roleIds.map((role_id) => ({ compte_id: compteId, role_id }))
    );
    if (insError) throw new Error(insError.message);
  }

  await logAudit({
    action: "compte.roles.set",
    entityType: "comptes_roles",
    entityId: compteId,
    details: { email, roles: unique, by: actorId },
  });

  return unique;
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  await requireAdmin();
  const supabase = await adminDb();

  const { data: comptes, error } = await supabase
    .from("comptes_systeme")
    .select("id, email, created_at")
    .order("email");
  if (error) throw new Error(error.message);

  const { data: links } = await supabase.from("comptes_roles").select("compte_id, role_id");
  const { data: roles } = await supabase.from("roles").select("id, code");
  const roleById = new Map((roles ?? []).map((r) => [r.id, r.code as RoleCode]));

  const rolesByCompte = new Map<string, RoleCode[]>();
  for (const link of links ?? []) {
    const code = roleById.get(link.role_id);
    if (!code || !ROLE_CODES.includes(code)) continue;
    const list = rolesByCompte.get(link.compte_id) ?? [];
    if (!list.includes(code)) list.push(code);
    rolesByCompte.set(link.compte_id, list);
  }

  const byId = new Map<string, AdminUserRow>();
  for (const c of comptes ?? []) {
    byId.set(c.id, {
      id: c.id,
      email: c.email,
      created_at: c.created_at,
      roles: rolesByCompte.get(c.id) ?? [],
      source: "compte",
    });
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const service = createSupabaseServiceClient();
      const { data: authData, error: authError } = await service.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      if (!authError) {
        for (const u of authData.users) {
          if (!u.email) continue;
          const existing = byId.get(u.id);
          if (existing) continue;
          byId.set(u.id, {
            id: u.id,
            email: u.email,
            created_at: u.created_at ?? null,
            roles: [],
            source: "auth",
          });
        }
      }
    } catch {
      // ignore
    }
  }

  // Toujours inclure l'utilisateur connecté
  const access = await getAccess();
  if (access.email && !byId.has(access.userId)) {
    byId.set(access.userId, {
      id: access.userId,
      email: access.email,
      created_at: null,
      roles: [],
      source: "auth",
    });
  }

  return Array.from(byId.values()).sort((a, b) => a.email.localeCompare(b.email));
}

/** Enregistre le compte connecté + rôles (bootstrap admin sans SQL). */
export async function registerMyself(roles: RoleCode[] = ["admin", "itam"]) {
  const access = await getAccess();
  if (!access.email) throw new Error("E-mail de session introuvable.");

  const supabase = await adminDb();
  await ensureCompte(supabase, access.userId, access.email, access.userId);
  const applied = await replaceRoles(
    supabase,
    access.userId,
    roles,
    access.userId,
    access.email
  );

  revalidatePath("/administration");
  return { ok: true as const, roles: applied };
}

/**
 * Crée un compte Auth + inscription ITAM + rôles, entièrement depuis le web.
 */
export async function createUserWithRoles(input: {
  email: string;
  password: string;
  roles: RoleCode[];
}) {
  const access = await requireAdmin();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const roles = input.roles.length > 0 ? input.roles : (["itam"] as RoleCode[]);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("E-mail invalide.");
  }
  if (password.length < 8) {
    throw new Error("Mot de passe : 8 caractères minimum.");
  }

  const service = requireServiceRole();
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(error?.message ?? "Création Auth impossible.");
  }

  await ensureCompte(service, data.user.id, email, access.userId);
  const applied = await replaceRoles(service, data.user.id, roles, access.userId, email);

  revalidatePath("/administration");
  return { ok: true as const, id: data.user.id, email, roles: applied };
}

export async function upsertCompteSysteme(input: { id: string; email: string }) {
  const access = await requireAdmin();
  const id = input.id.trim();
  const email = input.email.trim().toLowerCase();
  if (!id || !email) throw new Error("UUID et e-mail obligatoires.");
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("UUID Auth invalide.");

  const supabase = await adminDb();
  await ensureCompte(supabase, id, email, access.userId);
  revalidatePath("/administration");
  return { ok: true as const };
}

export async function setUserRoles(compteId: string, roles: RoleCode[]) {
  const access = await requireAdmin();
  const unique = Array.from(new Set(roles.filter((r) => ROLE_CODES.includes(r))));

  if (compteId === access.userId && !unique.includes("admin")) {
    throw new Error("Vous ne pouvez pas retirer votre propre rôle admin.");
  }

  const supabase = await adminDb();

  let { data: compte } = await supabase
    .from("comptes_systeme")
    .select("id, email")
    .eq("id", compteId)
    .maybeSingle();

  if (!compte) {
    // Auto-inscription depuis Auth ou session
    let email: string | null = null;
    if (compteId === access.userId) {
      email = access.email;
    } else if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const service = createSupabaseServiceClient();
      const { data } = await service.auth.admin.getUserById(compteId);
      email = data.user?.email ?? null;
    }
    if (!email) {
      throw new Error("Utilisateur inconnu. Créez-le via « Nouvel utilisateur ».");
    }
    await ensureCompte(supabase, compteId, email, access.userId);
    compte = { id: compteId, email };
  }

  const applied = await replaceRoles(
    supabase,
    compteId,
    unique,
    access.userId,
    compte.email
  );

  revalidatePath("/administration");
  return { ok: true as const, roles: applied };
}

export async function registerAuthUserAsCompte(userId: string) {
  const access = await requireAdmin();
  let email: string | null = null;

  if (userId === access.userId) {
    email = access.email;
  } else {
    const service = requireServiceRole();
    const { data, error } = await service.auth.admin.getUserById(userId);
    if (error || !data.user?.email) {
      throw new Error(error?.message ?? "Utilisateur Auth introuvable.");
    }
    email = data.user.email;
  }

  if (!email) throw new Error("E-mail introuvable.");
  return upsertCompteSysteme({ id: userId, email });
}
