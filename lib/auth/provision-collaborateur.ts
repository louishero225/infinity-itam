import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type ProvisionResult = {
  provisioned: boolean;
  createdCompte: boolean;
  assignedCollaborateur: boolean;
  employeLinked: boolean;
  reason?: string;
};

/**
 * Au premier login (souvent Microsoft) :
 * - enregistre le compte dans comptes_systeme (requis pour la RLS)
 * - assigne le rôle collaborateur s'il n'a encore aucun rôle
 * - ne touche pas aux rôles admin/itam déjà présents
 */
export async function provisionCollaborateurOnFirstLogin(input: {
  userId: string;
  email: string | null;
}): Promise<ProvisionResult> {
  const email = input.email?.trim().toLowerCase() ?? null;
  if (!input.userId) {
    return {
      provisioned: false,
      createdCompte: false,
      assignedCollaborateur: false,
      employeLinked: false,
      reason: "userId manquant",
    };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      provisioned: false,
      createdCompte: false,
      assignedCollaborateur: false,
      employeLinked: false,
      reason: "SUPABASE_SERVICE_ROLE_KEY absente",
    };
  }

  const admin = createSupabaseServiceClient();

  const { data: existingCompte } = await admin
    .from("comptes_systeme")
    .select("id")
    .eq("id", input.userId)
    .maybeSingle();

  let createdCompte = false;
  if (!existingCompte) {
    const { error } = await admin.from("comptes_systeme").upsert(
      {
        id: input.userId,
        email: email ?? `${input.userId}@unknown.local`,
      },
      { onConflict: "id" }
    );
    if (error) {
      return {
        provisioned: false,
        createdCompte: false,
        assignedCollaborateur: false,
        employeLinked: false,
        reason: error.message,
      };
    }
    createdCompte = true;
  } else if (email) {
    await admin.from("comptes_systeme").update({ email }).eq("id", input.userId);
  }

  const { data: links } = await admin
    .from("comptes_roles")
    .select("role_id")
    .eq("compte_id", input.userId);

  let assignedCollaborateur = false;
  if (!links || links.length === 0) {
    assignedCollaborateur = await assignRole(admin, input.userId, "collaborateur");
  }

  let employeLinked = false;
  if (email) {
    const { data: employe } = await admin
      .from("employes")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    employeLinked = Boolean(employe);
  }

  return {
    provisioned: true,
    createdCompte,
    assignedCollaborateur,
    employeLinked,
  };
}

async function assignRole(admin: SupabaseClient, compteId: string, code: string) {
  const { data: role, error: roleError } = await admin
    .from("roles")
    .select("id")
    .eq("code", code)
    .maybeSingle();

  if (roleError || !role) {
    // Migration 09 peut manquer : tenter d'insérer le rôle
    const { data: inserted, error: insertRoleError } = await admin
      .from("roles")
      .upsert({ code }, { onConflict: "code" })
      .select("id")
      .maybeSingle();
    if (insertRoleError || !inserted) return false;

    const { error } = await admin.from("comptes_roles").insert({
      compte_id: compteId,
      role_id: inserted.id,
    });
    return !error;
  }

  const { error } = await admin.from("comptes_roles").insert({
    compte_id: compteId,
    role_id: role.id,
  });
  return !error;
}
