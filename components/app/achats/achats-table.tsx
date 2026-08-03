"use client";

import * as React from "react";
import { toast } from "sonner";
import { Trash2, FileText, CheckCircle, XCircle } from "lucide-react";

import { deleteDemandeAchat, changerStatutDemande } from "@/app/(app)/achats/actions";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DemandeAchatFormDialog } from "./demande-achat-form-dialog";
import { useSortableRows } from "@/components/app/sortable-table-head";

type DemandeRow = {
  id: string | null;
  numero_demande: string | null;
  materiel_description: string | null;
  type_materiel: string | null;
  quantite: number | null;
  montant_total: number | null;
  fournisseur: string | null;
  statut: string | null;
  priorite: string | null;
  demandeur: string | null;
  date_demande: string | null;
  date_decaissement: string | null;
  date_reception: string | null;
  date_mise_production: string | null;
  alerte_delai: string | null;
};

export function AchatsTable({ rows }: { rows: DemandeRow[] }) {
  const [loading, setLoading] = React.useState<string | null>(null);

  const sortAccessors = React.useMemo(
    () => ({
      numero: (r: DemandeRow) => r.numero_demande,
      materiel: (r: DemandeRow) => r.materiel_description,
      fournisseur: (r: DemandeRow) => r.fournisseur,
      montant: (r: DemandeRow) => r.montant_total,
      statut: (r: DemandeRow) => r.statut,
      date: (r: DemandeRow) => r.date_demande,
    }),
    []
  );

  const { sortedData, renderHead } = useSortableRows(rows, sortAccessors);

  const handleDelete = async (id: string, numero: string) => {
    if (!confirm(`Supprimer la demande "${numero}" ?`)) return;

    try {
      setLoading(id);
      await deleteDemandeAchat(id);
      toast.success("Demande supprimée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(null);
    }
  };

  const handleChangeStatut = async (id: string, statut: string) => {
    try {
      setLoading(id);
      await changerStatutDemande(id, statut);
      toast.success("Statut mis à jour");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(null);
    }
  };

  const getStatutBadge = (statut: string | null) => {
    switch (statut) {
      case "En attente":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">En attente</Badge>;
      case "Approuvée":
        return <Badge className="bg-green-500 hover:bg-green-600">Approuvée</Badge>;
      case "Rejetée":
        return <Badge variant="destructive">Rejetée</Badge>;
      case "Décaissée":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Décaissée</Badge>;
      case "Réceptionnée":
        return <Badge className="bg-purple-500 hover:bg-purple-600">Réceptionnée</Badge>;
      case "En production":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">En production</Badge>;
      case "Annulée":
        return <Badge variant="secondary">Annulée</Badge>;
      default:
        return <Badge>—</Badge>;
    }
  };

  const getWorkflowActions = (statut: string | null) => {
    const actions = [];
    if (statut === "En attente") {
      actions.push({ label: "Approuver", value: "Approuvée" });
      actions.push({ label: "Rejeter", value: "Rejetée" });
    }
    if (statut === "Approuvée") {
      actions.push({ label: "Décaisser", value: "Décaissée" });
    }
    if (statut === "Décaissée") {
      actions.push({ label: "Réceptionner", value: "Réceptionnée" });
    }
    if (statut === "Réceptionnée") {
      actions.push({ label: "Mettre en production", value: "En production" });
    }
    return actions;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {renderHead("numero", "N° Demande")}
            {renderHead("materiel", "Matériel")}
            {renderHead("fournisseur", "Fournisseur")}
            {renderHead("montant", "Montant")}
            {renderHead("statut", "Statut")}
            {renderHead("date", "Workflow")}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((row) => {
            const workflowActions = getWorkflowActions(row.statut);
            const statutProtege = row.statut && ["Approuvée", "Décaissée", "Réceptionnée", "En production"].includes(row.statut);
            return (
              <TableRow key={row.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{row.numero_demande ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.date_demande
                        ? new Date(row.date_demande).toLocaleDateString("fr-FR")
                        : "—"}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{row.materiel_description ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.type_materiel && `Type: ${row.type_materiel}`}
                      {row.quantite && row.quantite > 1 && ` • Qté: ${row.quantite}`}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{row.fournisseur ?? "—"}</TableCell>
                <TableCell>
                  {row.montant_total
                    ? `${new Intl.NumberFormat("fr-FR").format(row.montant_total)} FCFA`
                    : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {getStatutBadge(row.statut)}
                    {row.alerte_delai === "En retard" && (
                      <Badge variant="destructive" className="text-xs">
                        Retard
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs space-y-1">
                    {row.date_decaissement && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Décaissé: {new Date(row.date_decaissement).toLocaleDateString("fr-FR")}
                      </div>
                    )}
                    {row.date_reception && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Réceptionné:{" "}
                        {new Date(row.date_reception).toLocaleDateString("fr-FR")}
                      </div>
                    )}
                    {row.date_mise_production && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        En prod:{" "}
                        {new Date(row.date_mise_production).toLocaleDateString("fr-FR")}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {workflowActions.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" disabled={loading === row.id}>
                            Workflow
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {workflowActions.map((action) => (
                            <DropdownMenuItem
                              key={action.value}
                              onClick={() => row.id && handleChangeStatut(row.id, action.value)}
                            >
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    <DemandeAchatFormDialog mode="edit" initialValues={row as any} />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        row.id && row.numero_demande && handleDelete(row.id, row.numero_demande)
                      }
                      disabled={loading === row.id || !!statutProtege}
                      title={statutProtege ? "Suppression impossible: demande approuvée ou décaissée" : undefined}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {sortedData.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Aucune demande d'achat
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
