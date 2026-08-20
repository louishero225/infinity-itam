import Link from "next/link";

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

export type MaterielTicketRow = {
  id: string;
  date: string;
  demandeur: string;
  categorie: string;
  statut: string;
  en_retard: boolean;
};

export function MaterielTicketsCard({
  tickets,
  detenteurLabel,
}: {
  tickets: MaterielTicketRow[];
  detenteurLabel: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Tickets du détenteur</CardTitle>
        <CardDescription>
          {detenteurLabel
            ? `Demandes support de ${detenteurLabel}`
            : "Aucun détenteur actif — pas de tickets à croiser."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!detenteurLabel ? (
          <p className="text-muted-foreground text-sm">Matériel non attribué actuellement.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Demandeur</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Aucun ticket pour ce détenteur.
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap">{t.date}</TableCell>
                    <TableCell>{t.demandeur}</TableCell>
                    <TableCell className="text-muted-foreground">{t.categorie}</TableCell>
                    <TableCell>
                      <Badge variant={t.en_retard ? "destructive" : "secondary"}>{t.statut}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/itsm/tickets/${t.id}`}>Ouvrir</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
