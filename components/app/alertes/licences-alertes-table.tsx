"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSortableRows } from "@/components/app/sortable-table-head";

type LicenceAlerteRow = {
  id: string;
  nom: string;
  editeur: string | null;
  date_expiration: string;
  cout: number | null;
  statut: string;
  gestionnaire_prenom: string | null;
  gestionnaire_nom: string | null;
  gestionnaire_email: string | null;
  jours_avant_expiration: number | null;
  niveau_urgence: string;
};

export function LicencesAlertesTable({ rows }: { rows: LicenceAlerteRow[] }) {
  const sortAccessors = React.useMemo(
    () => ({
      nom: (r: LicenceAlerteRow) => r.nom,
      editeur: (r: LicenceAlerteRow) => r.editeur,
      gestionnaire: (r: LicenceAlerteRow) =>
        r.gestionnaire_nom ? `${r.gestionnaire_nom} ${r.gestionnaire_prenom}` : "",
      expiration: (r: LicenceAlerteRow) => r.date_expiration,
      jours: (r: LicenceAlerteRow) => r.jours_avant_expiration,
      cout: (r: LicenceAlerteRow) => r.cout,
      urgence: (r: LicenceAlerteRow) => r.niveau_urgence,
    }),
    []
  );

  const { sortedData, renderHead } = useSortableRows(rows, sortAccessors);

  const getUrgenceBadge = (niveau: string) => {
    switch (niveau) {
      case "Expirée":
        return <Badge variant="destructive">Expirée</Badge>;
      case "Critique":
        return <Badge className="bg-orange-600 hover:bg-orange-700">Critique (&lt;7j)</Badge>;
      case "Urgent":
        return <Badge className="bg-yellow-600 hover:bg-yellow-700">Urgent (&lt;30j)</Badge>;
      case "Attention":
        return <Badge className="bg-blue-600 hover:bg-blue-700">Attention (&lt;60j)</Badge>;
      default:
        return <Badge variant="secondary">{niveau}</Badge>;
    }
  };

  const formatJoursRestants = (jours: number | null) => {
    if (jours === null) return "—";
    if (jours < 0) return `${Math.abs(jours)} jours de retard`;
    if (jours === 0) return "Aujourd'hui";
    return `${jours} jours`;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {renderHead("nom", "Licence")}
            {renderHead("editeur", "Éditeur")}
            {renderHead("gestionnaire", "Gestionnaire")}
            {renderHead("expiration", "Expiration")}
            {renderHead("jours", "Jours restants")}
            {renderHead("cout", "Coût")}
            {renderHead("urgence", "Urgence")}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.nom}</TableCell>
              <TableCell>{row.editeur ?? "—"}</TableCell>
              <TableCell>
                {row.gestionnaire_prenom && row.gestionnaire_nom ? (
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {row.gestionnaire_prenom} {row.gestionnaire_nom}
                    </span>
                    {row.gestionnaire_email && (
                      <span className="text-xs text-muted-foreground">
                        {row.gestionnaire_email}
                      </span>
                    )}
                  </div>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                {new Date(row.date_expiration).toLocaleDateString("fr-FR")}
              </TableCell>
              <TableCell>
                <span
                  className={
                    row.jours_avant_expiration !== null && row.jours_avant_expiration < 0
                      ? "text-red-600 font-semibold"
                      : ""
                  }
                >
                  {formatJoursRestants(row.jours_avant_expiration)}
                </span>
              </TableCell>
              <TableCell>
                {row.cout
                  ? new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "XOF",
                      maximumFractionDigits: 0
                    }).format(row.cout)
                  : "—"}
              </TableCell>
              <TableCell>{getUrgenceBadge(row.niveau_urgence)}</TableCell>
            </TableRow>
          ))}
          {sortedData.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Aucune alerte de renouvellement
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
