"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

import { deleteDemandeOrange, type DemandeOrangeRow } from "@/app/(app)/flotte/actions";
import { DEMANDE_ORANGE_LABELS } from "@/lib/flotte/constants";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertDialogConfirm } from "@/components/ui/alert-dialog-confirm";
import { cn } from "@/lib/utils";

const DemandeOrangeFormDialog = dynamic(
  () =>
    import("./demande-orange-form-dialog").then((m) => ({
      default: m.DemandeOrangeFormDialog,
    })),
  { ssr: false }
);

function statutClass(statut: string) {
  const map: Record<string, string> = {
    brouillon: "bg-slate-100 text-slate-700",
    soumise: "bg-sky-100 text-sky-900",
    en_cours: "bg-amber-100 text-amber-900",
    livree: "bg-emerald-100 text-emerald-900",
    annulee: "bg-red-100 text-red-800",
  };
  return map[statut] ?? map.brouillon;
}

export function DemandesOrangeTable({
  rows,
  canWrite,
}: {
  rows: DemandeOrangeRow[];
  canWrite: boolean;
}) {
  const [deleteTarget, setDeleteTarget] = React.useState<DemandeOrangeRow | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await deleteDemandeOrange(deleteTarget.id);
      toast.success("Demande supprimée");
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Réf. Orange</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Qté</TableHead>
            <TableHead>Livrés</TableHead>
            <TableHead>Motif</TableHead>
            <TableHead className="w-[100px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-muted-foreground py-10 text-center text-sm">
                Aucune demande Orange enregistrée.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap text-sm tabular-nums">
                  {r.date_demande}
                </TableCell>
                <TableCell className="font-mono text-xs">{r.reference_orange ?? "—"}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold",
                      statutClass(r.statut)
                    )}
                  >
                    {DEMANDE_ORANGE_LABELS[r.statut]}
                  </span>
                </TableCell>
                <TableCell className="tabular-nums">{r.quantite}</TableCell>
                <TableCell className="tabular-nums">{r.numeros_count ?? 0}</TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate text-sm">
                  {r.motif ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {canWrite ? (
                    <div className="flex justify-end gap-1">
                      <DemandeOrangeFormDialog
                        initial={r}
                        trigger={
                          <Button variant="ghost" size="icon" className="size-8">
                            <Pencil className="size-3.5" />
                          </Button>
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        onClick={() => setDeleteTarget(r)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <AlertDialogConfirm
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Supprimer cette demande ?"
        description="L'historique de la demande sera perdu (les numéros liés restent en base)."
        confirmText="Supprimer"
        variant="destructive"
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
