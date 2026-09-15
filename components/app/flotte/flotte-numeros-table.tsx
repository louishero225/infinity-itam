"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { toast } from "sonner";
import { PhoneOff, Pencil } from "lucide-react";

import {
  deleteNumeroFlotte,
  libererNumeroFlotte,
  type NumeroFlotteRow,
} from "@/app/(app)/flotte/actions";
import { FLOTTE_STATUT_LABELS, FLOTTE_FORMULE_LABELS } from "@/lib/flotte/constants";
import { formatPhoneDisplay } from "@/lib/flotte/phone-utils";
import { employeDisplayName } from "@/lib/utils/employe-matching";
import { Badge } from "@/components/ui/badge";
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

const NumeroFlotteFormDialog = dynamic(
  () =>
    import("./numero-flotte-form-dialog").then((m) => ({
      default: m.NumeroFlotteFormDialog,
    })),
  { ssr: false }
);

function statutBadge(statut: string) {
  const map: Record<string, string> = {
    attribue: "bg-sky-100 text-sky-900 border-sky-200",
    disponible: "bg-emerald-100 text-emerald-900 border-emerald-200",
    reserve: "bg-amber-100 text-amber-900 border-amber-200",
    desactive: "bg-slate-100 text-slate-600 border-slate-200",
    en_commande: "bg-violet-100 text-violet-900 border-violet-200",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold",
        map[statut] ?? map.desactive
      )}
    >
      {FLOTTE_STATUT_LABELS[statut as keyof typeof FLOTTE_STATUT_LABELS] ?? statut}
    </span>
  );
}

type Props = {
  rows: NumeroFlotteRow[];
  employes: { id: string; prenom: string; nom: string; departement: string }[];
  canWrite: boolean;
};

export function FlotteNumerosTable({ rows, employes, canWrite }: Props) {
  const [deleteTarget, setDeleteTarget] = React.useState<NumeroFlotteRow | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState<string>("all");

  const filtered = rows.filter((r) => {
    if (filter !== "all" && r.statut !== filter) return false;
    if (!q.trim()) return true;
    const hay = [
      r.numero,
      r.titulaire_libre,
      r.departement,
      r.fonction,
      r.employe ? employeDisplayName(r.employe.prenom, r.employe.nom) : "",
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  async function handleLiberer(id: string) {
    setBusy(id);
    try {
      await libererNumeroFlotte(id, "Libération manuelle");
      toast.success("Numéro libéré");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusy(deleteTarget.id);
    try {
      await deleteNumeroFlotte(deleteTarget.id);
      toast.success("Numéro supprimé");
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher numéro, titulaire, département…"
          className="border-input bg-background h-8 min-w-[220px] flex-1 rounded-md border px-3 text-sm"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border-input bg-background h-8 rounded-md border px-2 text-xs"
        >
          <option value="all">Tous statuts</option>
          {Object.entries(FLOTTE_STATUT_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numéro</TableHead>
              <TableHead>Titulaire</TableHead>
              <TableHead>Fonction</TableHead>
              <TableHead>Département</TableHead>
              <TableHead>Forfait / mois</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-[140px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-10 text-center text-sm">
                  Aucun numéro. Importez le fichier Excel ou ajoutez un numéro.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => {
                const titulaire = r.employe
                  ? employeDisplayName(r.employe.prenom, r.employe.nom)
                  : r.titulaire_libre ?? "—";
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm font-medium tabular-nums">
                      {formatPhoneDisplay(r.numero_normalise)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{titulaire}</div>
                      {r.employe ? (
                        <Link
                          href={`/employes/${r.employe.id}`}
                          className="text-muted-foreground text-xs hover:underline"
                        >
                          Fiche collaborateur
                        </Link>
                      ) : r.titulaire_libre ? (
                        <Badge variant="outline" className="mt-0.5 text-[10px]">
                          Non lié ITAM
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[180px] truncate text-sm">
                      {r.fonction ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[160px] truncate text-sm">
                      {r.departement ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {r.formule ? (
                        <div>
                          <div className="font-medium">
                            {FLOTTE_FORMULE_LABELS[r.formule as keyof typeof FLOTTE_FORMULE_LABELS] ??
                              r.formule}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {r.montant_ttc != null
                              ? `${r.montant_ttc.toLocaleString("fr-FR")} F TTC`
                              : "—"}
                          </div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{statutBadge(r.statut)}</TableCell>
                    <TableCell className="text-right">
                      {canWrite ? (
                        <div className="flex justify-end gap-1">
                          <NumeroFlotteFormDialog
                            employes={employes}
                            initial={r}
                            trigger={
                              <Button variant="ghost" size="icon" className="size-8">
                                <Pencil className="size-3.5" />
                              </Button>
                            }
                          />
                          {r.statut === "attribue" ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              disabled={busy === r.id}
                              onClick={() => void handleLiberer(r.id)}
                              title="Libérer"
                            >
                              <PhoneOff className="size-3.5" />
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialogConfirm
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Supprimer ce numéro ?"
        description={`${deleteTarget?.numero ?? ""} sera retiré du registre.`}
        confirmText="Supprimer"
        variant="destructive"
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
