"use client";

import Link from "next/link";
import { Package, Calendar, User, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type AcquisitionRow = {
  id: string | null;
  code_materiel: string | null;
  type: string | null;
  date_achat: string | null;
  cout: number | null;
  statut: string | null;
  numero_demande: string | null;
  employe_nom: string | null;
  employe_prenom: string | null;
};

export function DernieresAcquisitions({ rows }: { rows: AcquisitionRow[] }) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="h-4 w-4" />
            Dernières acquisitions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune acquisition récente
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Package className="h-4 w-4" />
          Dernières acquisitions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rows.map((row) => (
            <Link
              key={row.id}
              href={`/materiels/${row.id}`}
              className="block p-3 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">
                      {row.code_materiel}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {row.type}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {row.date_achat && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(row.date_achat).toLocaleDateString("fr-FR")}
                      </div>
                    )}

                    {row.cout && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {new Intl.NumberFormat("fr-FR").format(row.cout)} FCFA
                      </div>
                    )}

                    {row.employe_nom && row.employe_prenom && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {row.employe_prenom} {row.employe_nom}
                      </div>
                    )}

                    {!row.employe_nom && (
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {row.statut || "Stock"}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {row.numero_demande && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Demande: {row.numero_demande}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/materiels"
          className="block mt-4 text-center text-sm text-primary hover:underline"
        >
          Voir tous les matériels →
        </Link>
      </CardContent>
    </Card>
  );
}
