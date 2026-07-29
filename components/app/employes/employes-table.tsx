"use client";

import Link from "next/link";
import { Laptop } from "lucide-react";

import { DataTable } from "@/components/app/data-table";
import { Badge } from "@/components/ui/badge";
import { EmployeMaterielDialog } from "./employe-materiel-dialog";

type EmployeRow = {
  id: string;
  prenom: string;
  nom: string;
  departement: string;
  service: string | null;
  fonction: string | null;
  materiel_count?: number;
  materiel_actif?: number;
};

export function EmployesTable({ rows }: { rows: EmployeRow[] }) {
  return (
    <DataTable
      data={rows}
      searchPlaceholder="Rechercher (nom, prénom, département, service...)"
      columns={[
        {
          key: "nom",
          header: "Nom",
          cell: (r) => (
            <div>
              <Link href={`/employes/${r.id}`} className="font-medium underline hover:text-primary">
                {r.prenom} {r.nom}
              </Link>
              <div className="text-xs text-muted-foreground mt-0.5">
                <Badge variant="outline" className="text-xs">
                  {r.departement}
                </Badge>
              </div>
            </div>
          ),
          searchableText: (r) => `${r.prenom} ${r.nom}`,
        },
        {
          key: "fonction",
          header: "Fonction",
          cell: (r) => (
            <div className="text-sm">
              <div>{r.fonction ?? "—"}</div>
              {r.service && (
                <div className="text-xs text-muted-foreground">{r.service}</div>
              )}
            </div>
          ),
          searchableText: (r) => `${r.fonction ?? ""} ${r.service ?? ""}`,
        },
        {
          key: "materiel",
          header: "Matériel",
          cell: (r) => (
            <div className="flex items-center gap-2">
              {r.materiel_actif && r.materiel_actif > 0 ? (
                <EmployeMaterielDialog
                  employeId={r.id}
                  employeNom={r.nom}
                  employePrenom={r.prenom}
                  materielCount={r.materiel_actif}
                />
              ) : (
                <span className="text-xs text-muted-foreground">Aucun équipement</span>
              )}
            </div>
          ),
          searchableText: () => "",
        },
      ]}
    />
  );
}
