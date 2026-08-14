"use server";

import { revalidatePath } from "next/cache";

import { requireWrite } from "@/lib/auth/roles";
import { logAudit } from "@/lib/server/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function listPiecesJointes(entityType: string, entityId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pieces_jointes")
    .select("id, nom_fichier, mime_type, taille_octets, created_at, storage_path")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function uploadPieceJointe(formData: FormData) {
  const access = await requireWrite();
  const entityType = String(formData.get("entity_type") ?? "");
  const entityId = String(formData.get("entity_id") ?? "");
  const file = formData.get("file");

  if (!entityType || !entityId || !(file instanceof File) || file.size === 0) {
    throw new Error("Fichier ou cible manquant.");
  }

  const supabase = await createSupabaseServerClient();
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${entityType}/${entityId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("itam-fichiers")
    .upload(path, file, { contentType: file.type || undefined, upsert: false });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { error } = await supabase.from("pieces_jointes").insert({
    entity_type: entityType,
    entity_id: entityId,
    nom_fichier: file.name,
    mime_type: file.type || null,
    taille_octets: file.size,
    storage_path: path,
    created_by: access.userId,
  });

  if (error) throw new Error(error.message);

  await logAudit({
    action: "upload_piece_jointe",
    entityType,
    entityId,
    details: { nom: file.name },
  });

  revalidatePath("/materiels");
  revalidatePath(`/materiels/${entityId}`);
}

export async function getPieceJointeUrl(storagePath: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from("itam-fichiers")
    .createSignedUrl(storagePath, 60 * 10);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Impossible d'ouvrir le fichier");
  }
  return data.signedUrl;
}
