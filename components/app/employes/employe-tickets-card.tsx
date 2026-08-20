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

export type EmployeTicketRow = {
  id: string;
  date: string;
  heure_creation: string;
  categorie: string;
  statut: string;
  en_retard: boolean;
  description: string | null;
};

export function EmployeTicketsCard({ tickets }: { tickets: EmployeTicketRow[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-sm">Tickets support</CardTitle>
          <CardDescription>Demandes IT liées à ce collaborateur</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/itsm">Voir ITSM</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  Aucun ticket lié.
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="whitespace-nowrap">
                    {t.date} {String(t.heure_creation).slice(0, 5)}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[180px] truncate">{t.categorie}</div>
                    {t.description ? (
                      <p className="text-muted-foreground max-w-[220px] truncate text-xs">
                        {t.description}
                      </p>
                    ) : null}
                  </TableCell>
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
      </CardContent>
    </Card>
  );
}
