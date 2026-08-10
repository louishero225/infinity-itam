"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSortableRows } from "@/components/app/sortable-table-head";

type PaiementAlerteRow = {
  paiement_id: string;
  licence_id: string;
  licence_nom: string;
  editeur: string | null;
  date_paiement_prevue: string;
  date_paiement_effectuee: string | null;
  montant_prevu: number;
  montant_paye: number | null;
  statut: string;
  mode_paiement: string | null;
  reference_paiement: string | null;
  gestionnaire_prenom: string | null;
  gestionnaire_nom: string | null;
  gestionnaire_email: string | null;
  jours_retard: number | null;
  niveau_urgence_paiement: string;
};

export function PaiementsAlertesTable({ rows }: { rows: PaiementAlerteRow[] }) {
  const sortAccessors = React.useMemo(
    () => ({
      licence: (r: PaiementAlerteRow) => r.licence_nom,
      editeur: (r: PaiementAlerteRow) => r.editeur,
      gestionnaire: (r: PaiementAlerteRow) =>
        r.gestionnaire_nom ? `${r.gestionnaire_nom} ${r.gestionnaire_prenom}` : "",
      date: (r: PaiementAlerteRow) => r.date_paiement_prevue,
      montant: (r: PaiementAlerteRow) => r.montant_prevu,
      retard: (r: PaiementAlerteRow) => r.jours_retard,
      urgence: (r: PaiementAlerteRow) => r.niveau_urgence_paiement,
    }),
    []
  );

  const { sortedData, renderHead } = useSortableRows(rows, sortAccessors);

  const getUrgenceBadge = (niveau: string) => {
    switch (niveau) {
      case "Très en retard":
        return <Badge variant="destructive">Très en retard</Badge>;
      case "En retard":
        return <Badge className="bg-orange-600 hover:bg-orange-700">En retard</Badge>;
      case "À payer bientôt":
        return <Badge className="bg-yellow-600 hover:bg-yellow-700">À payer bientôt</Badge>;
      case "À venir":
        return <Badge className="bg-blue-600 hover:bg-blue-700">À venir (30j)</Badge>;
      case "Payé":
        return <Badge className="bg-green-600 hover:bg-green-700">Payé</Badge>;
      default:
        return <Badge variant="secondary">{niveau}</Badge>;
    }
  };

  const formatJoursRetard = (jours: number | null) => {
    if (jours === null || jours <= 0) return "—";
    if (jours === 1) return "1 jour de retard";
    return `${jours} jours de retard`;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {renderHead("licence", "Licence")}
            {renderHead("editeur", "Éditeur")}
            {renderHead("gestionnaire", "Gestionnaire")}
            {renderHead("date", "Date prévue")}
            {renderHead("montant", "Montant")}
            {renderHead("retard", "Retard")}
            {renderHead("urgence", "Urgence")}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((row) => (
            <TableRow key={row.paiement_id}>
              <TableCell className="font-medium">{row.licence_nom}</TableCell>
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
                {new Date(row.date_paiement_prevue).toLocaleDateString("fr-FR")}
              </TableCell>
              <TableCell>
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "XOF",
                  maximumFractionDigits: 0
                }).format(row.montant_prevu)}
              </TableCell>
              <TableCell>
                <span
                  className={
                    row.jours_retard && row.jours_retard > 0
                      ? "text-red-600 font-semibold"
                      : ""
                  }
                >
                  {formatJoursRetard(row.jours_retard)}
                </span>
              </TableCell>
              <TableCell>{getUrgenceBadge(row.niveau_urgence_paiement)}</TableCell>
            </TableRow>
          ))}
          {sortedData.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Aucun paiement en attente
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
