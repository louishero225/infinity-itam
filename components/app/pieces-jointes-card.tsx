"use client";

import * as React from "react";
import { toast } from "sonner";
import { Paperclip } from "lucide-react";

import { getPieceJointeUrl, uploadPieceJointe } from "@/app/(app)/fichiers/actions";
import { useAccess } from "@/components/app/access-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Piece = {
  id: string;
  nom_fichier: string;
  mime_type: string | null;
  taille_octets: number | null;
  created_at: string;
  storage_path: string;
};

export function PiecesJointesCard({
  entityType,
  entityId,
  pieces,
}: {
  entityType: string;
  entityId: string;
  pieces: Piece[];
}) {
  const { canWrite } = useAccess();
  const [pending, setPending] = React.useState(false);

  async function onUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("entity_type", entityType);
    formData.set("entity_id", entityId);
    formData.set("file", file);
    setPending(true);
    try {
      await uploadPieceJointe(formData);
      toast.success("Fichier ajouté");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Téléversement impossible");
    } finally {
      setPending(false);
      event.target.value = "";
    }
  }

  async function openFile(path: string) {
    try {
      const url = await getPieceJointeUrl(path);
      window.open(url, "_blank");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ouverture impossible");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Pièces jointes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pieces.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun fichier.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {pieces.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="hover:underline"
                  onClick={() => openFile(p.storage_path)}
                >
                  {p.nom_fichier}
                </button>
              </li>
            ))}
          </ul>
        )}
        {canWrite ? (
          <label className="inline-flex">
            <input type="file" className="hidden" onChange={onUpload} disabled={pending} />
            <Button type="button" variant="outline" size="sm" asChild>
              <span>
                <Paperclip className="size-4" />
                {pending ? "Téléversement…" : "Ajouter un fichier"}
              </span>
            </Button>
          </label>
        ) : null}
      </CardContent>
    </Card>
  );
}
