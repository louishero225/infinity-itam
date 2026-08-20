import Link from "next/link";
import { Laptop, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { summarizeParcDemandeur } from "@/lib/itsm/ticket-context";

export type DemandeurParcMateriel = {
  attribution_id: string;
  date_attribution: string;
  materiel: {
    id: string;
    code_materiel: string;
    type: string;
    marque: string | null;
    modele: string | null;
    statut: string | null;
  } | null;
};

export type DemandeurParcContext = {
  employe: {
    id: string;
    prenom: string;
    nom: string;
    departement: string;
    site: string | null;
    fonction: string | null;
  } | null;
  materiels: DemandeurParcMateriel[];
  resolvedVia: "employe_id" | "nom" | null;
};

export function TicketDemandeurParcCard({
  demandeurLabel,
  context,
}: {
  demandeurLabel: string;
  context: DemandeurParcContext;
}) {
  const actifs = context.materiels
    .map((row) => row.materiel)
    .filter((m): m is NonNullable<typeof m> => Boolean(m));
  const summary = summarizeParcDemandeur(actifs);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="size-4" />
          Demandeur & parc
        </CardTitle>
        <CardDescription>
          {context.employe
            ? summary.label
            : "Aucune fiche collaborateur liée — lancez le rapprochement ITAM si besoin."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {context.employe ? (
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">
                  {context.employe.prenom} {context.employe.nom}
                </p>
                <p className="text-muted-foreground text-sm">
                  {context.employe.departement}
                  {context.employe.fonction ? ` · ${context.employe.fonction}` : ""}
                  {context.employe.site ? ` · ${context.employe.site}` : ""}
                </p>
                {context.resolvedVia === "nom" ? (
                  <Badge variant="outline" className="mt-2">
                    Lié par nom
                  </Badge>
                ) : null}
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/employes/${context.employe.id}`}>Fiche collaborateur</Link>
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Demandeur saisi : <span className="text-foreground font-medium">{demandeurLabel}</span>
          </p>
        )}

        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Laptop className="size-4" />
            Matériel attribué
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Modèle</TableHead>
                <TableHead>Depuis</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {context.materiels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    Aucun matériel actif pour ce demandeur.
                  </TableCell>
                </TableRow>
              ) : (
                context.materiels.map((row) => (
                  <TableRow key={row.attribution_id}>
                    <TableCell className="font-medium">
                      {row.materiel ? (
                        <Link
                          href={`/materiels/${row.materiel.id}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {row.materiel.code_materiel}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{row.materiel?.type ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {[row.materiel?.marque, row.materiel?.modele].filter(Boolean).join(" ") ||
                        "—"}
                    </TableCell>
                    <TableCell>{row.date_attribution}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
