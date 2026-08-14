import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAccess } from "@/lib/auth/roles";

export async function logAudit(input: {
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
}) {
  try {
    const supabase = await createSupabaseServerClient();
    let userId: string | null = null;
    let email: string | null = null;
    try {
      const access = await getAccess();
      userId = access.userId;
      email = access.email;
    } catch {
      // ignore
    }

    await supabase.from("audit_log").insert({
      user_id: userId,
      user_email: email,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      details: input.details ?? null,
    });
  } catch {
    // Table absente tant que la migration n'est pas appliquée
  }
}
