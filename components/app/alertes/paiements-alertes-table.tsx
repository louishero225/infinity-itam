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
            <TableHead>Licence</TableHead>
            <TableHead>Éditeur</TableHead>
            <TableHead>Gestionnaire</TableHead>
            <TableHead>Date prévue</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>Retard</TableHead>
            <TableHead>Urgence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
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
          {rows.length === 0 && (
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
