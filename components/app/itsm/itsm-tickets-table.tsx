import Link from "next/link";

import type { IitsmTicket } from "@/app/(app)/itsm/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function ItsmTicketsTable({ tickets }: { tickets: IitsmTicket[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Liste des tickets</CardTitle>
        <CardDescription>{tickets.length} ticket(s) affiché(s) — 200 derniers.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Demandeur</TableHead>
              <TableHead>Entité</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Retard</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground py-8 text-center">
                  Aucun ticket pour le moment.
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="whitespace-nowrap">
                    {t.date} {String(t.heure_creation).slice(0, 5)}
                  </TableCell>
                  <TableCell>{t.demandeur}</TableCell>
                  <TableCell className="text-muted-foreground">{t.entite || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{t.categorie}</TableCell>
                  <TableCell>{t.statut}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{t.source}</Badge>
                  </TableCell>
                  <TableCell>
                    {t.en_retard ? (
                      <Badge variant="destructive">Oui</Badge>
                    ) : (
                      <Badge variant="secondary">Non</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/itsm/tickets/${t.id}`}>Ouvrir</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
