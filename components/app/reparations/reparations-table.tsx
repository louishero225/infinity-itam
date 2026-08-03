"use client";

import * as React from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { deleteReparation } from "@/app/(app)/reparations/actions";
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
import { ReparationFormDialog } from "./reparation-form-dialog";
import { useSortableRows } from "@/components/app/sortable-table-head";

type ReparationRow = {
  id: string | null;
  date_debut: string | null;
  date_fin: string | null;
  type_intervention: string | null;
  description: string | null;
  cout: number | null;
  prestataire: string | null;
  statut: string | null;
  priorite: string | null;
  code_materiel: string | null;
  materiel_type: string | null;
  marque: string | null;
  modele: string | null;
  duree_jours: number | null;
};

export function ReparationsTable({ rows }: { rows: ReparationRow[] }) {
  const [deleting, setDeleting] = React.useState<string | null>(null);

  const sortAccessors = React.useMemo(
    () => ({
      materiel: (r: ReparationRow) => r.code_materiel,
      type: (r: ReparationRow) => r.type_intervention,
      date: (r: ReparationRow) => r.date_debut,
      duree: (r: ReparationRow) => r.duree_jours,
      prestataire: (r: ReparationRow) => r.prestataire,
      statut: (r: ReparationRow) => r.statut,
    }),
    []
  );

  const { sortedData, renderHead } = useSortableRows(rows, sortAccessors);

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette réparation ?")) return;

    try {
      setDeleting(id);
      await deleteReparation(id);
      toast.success("Réparation supprimée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setDeleting(null);
    }
  };

  const getStatutBadge = (statut: string | null) => {
    switch (statut) {
      case "En attente":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">En attente</Badge>;
      case "En cours":
        return <Badge className="bg-blue-500 hover:bg-blue-600">En cours</Badge>;
      case "Terminée":
        return <Badge className="bg-green-500 hover:bg-green-600">Terminée</Badge>;
      case "Annulée":
        return <Badge variant="secondary">Annulée</Badge>;
      default:
        return <Badge>—</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {renderHead("materiel", "Matériel")}
            {renderHead("type", "Type intervention")}
            {renderHead("date", "Date début")}
            {renderHead("duree", "Durée")}
            {renderHead("prestataire", "Prestataire")}
            {renderHead("statut", "Statut")}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{row.code_materiel ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">
                    {row.materiel_type} {row.marque && `- ${row.marque}`}
                  </div>
                </div>
              </TableCell>
              <TableCell>{row.type_intervention ?? "—"}</TableCell>
              <TableCell>
                {row.date_debut ? new Date(row.date_debut).toLocaleDateString("fr-FR") : "—"}
              </TableCell>
              <TableCell>
                {row.duree_jours !== null ? `${row.duree_jours} jour(s)` : "—"}
              </TableCell>
              <TableCell>{row.prestataire ?? "—"}</TableCell>
              <TableCell>{getStatutBadge(row.statut)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <ReparationFormDialog mode="edit" initialValues={row as any} />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => row.id && handleDelete(row.id)}
                    disabled={deleting === row.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {sortedData.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Aucune réparation
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
