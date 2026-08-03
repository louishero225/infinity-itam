"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

import { traiterAlerte, ignorerAlerte } from "@/app/(app)/alertes/actions";
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
import { useSortableRows } from "@/components/app/sortable-table-head";

type AlerteRow = {
  id: string | null;
  type: string | null;
  titre: string | null;
  description: string | null;
  priorite: string | null;
  date_echeance: string | null;
  code_materiel: string | null;
  materiel_type: string | null;
  licence_nom: string | null;
  urgence: string | null;
  created_at: string | null;
};

export function AlertesTable({ rows }: { rows: AlerteRow[] }) {
  const [loading, setLoading] = React.useState<string | null>(null);

  const sortAccessors = React.useMemo(
    () => ({
      type: (r: AlerteRow) => r.type,
      titre: (r: AlerteRow) => r.titre,
      priorite: (r: AlerteRow) => r.priorite,
      urgence: (r: AlerteRow) => r.urgence,
      echeance: (r: AlerteRow) => r.date_echeance,
      lie: (r: AlerteRow) => r.code_materiel ?? r.licence_nom,
    }),
    []
  );

  const { sortedData, renderHead } = useSortableRows(rows, sortAccessors);

  const handleTraiter = async (id: string) => {
    try {
      setLoading(id);
      await traiterAlerte(id);
      toast.success("Alerte traitée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(null);
    }
  };

  const handleIgnorer = async (id: string) => {
    try {
      setLoading(id);
      await ignorerAlerte(id);
      toast.success("Alerte ignorée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(null);
    }
  };

  const getPrioriteBadge = (priorite: string | null) => {
    switch (priorite) {
      case "critique":
        return <Badge className="bg-red-500 hover:bg-red-600">Critique</Badge>;
      case "haute":
        return <Badge className="bg-orange-500 hover:bg-orange-600">Haute</Badge>;
      case "normale":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Normale</Badge>;
      case "basse":
        return <Badge className="bg-gray-500 hover:bg-gray-600">Basse</Badge>;
      default:
        return <Badge>—</Badge>;
    }
  };

  const getUrgenceBadge = (urgence: string | null) => {
    switch (urgence) {
      case "Échue":
        return <Badge variant="destructive">Échue</Badge>;
      case "Urgente":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Urgente</Badge>;
      case "Prochaine":
        return <Badge variant="outline">Prochaine</Badge>;
      default:
        return <Badge variant="secondary">Planifiée</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {renderHead("type", "Type")}
            {renderHead("titre", "Titre")}
            {renderHead("priorite", "Priorité")}
            {renderHead("urgence", "Urgence")}
            {renderHead("echeance", "Échéance")}
            {renderHead("lie", "Lié à")}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="capitalize">{row.type ?? "—"}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{row.titre ?? "—"}</div>
                  {row.description && (
                    <div className="text-xs text-muted-foreground mt-1">{row.description}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>{getPrioriteBadge(row.priorite)}</TableCell>
              <TableCell>{getUrgenceBadge(row.urgence)}</TableCell>
              <TableCell>
                {row.date_echeance
                  ? new Date(row.date_echeance).toLocaleDateString("fr-FR")
                  : "—"}
              </TableCell>
              <TableCell>
                {row.licence_nom && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Licence: </span>
                    {row.licence_nom}
                  </div>
                )}
                {row.code_materiel && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Matériel: </span>
                    {row.code_materiel} ({row.materiel_type})
                  </div>
                )}
                {!row.licence_nom && !row.code_materiel && "—"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => row.id && handleTraiter(row.id)}
                    disabled={loading === row.id}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Traiter
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => row.id && handleIgnorer(row.id)}
                    disabled={loading === row.id}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Ignorer
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {sortedData.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Aucune alerte active
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
