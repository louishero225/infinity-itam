"use client";

import { DataTable } from "@/components/app/data-table";
import { Badge } from "@/components/ui/badge";
import { BENEFICIAIRE_TYPE_LABELS, type BeneficiaireType } from "@/lib/utils/beneficiaire";

type EntiteWithCount = {
  id: string;
  code: string;
  nom: string;
  type: string;
  materiel_actif: number;
};

export function EntitesTable({ rows }: { rows: EntiteWithCount[] }) {
  return (
    <DataTable
      data={rows}
      getRowKey={(r) => r.id}
      searchPlaceholder="Rechercher une entité..."
      columns={[
        {
          key: "nom",
          header: "Nom",
          cell: (r) => <span className="font-medium">{r.nom}</span>,
          searchableText: (r) => `${r.nom} ${r.code}`,
          sortValue: (r) => r.nom,
        },
        {
          key: "code",
          header: "Code",
          cell: (r) => r.code,
          sortValue: (r) => r.code,
        },
        {
          key: "type",
          header: "Type",
          cell: (r) => (
            <Badge variant="outline">
              {BENEFICIAIRE_TYPE_LABELS[r.type as BeneficiaireType] ?? r.type}
            </Badge>
          ),
          sortValue: (r) => r.type,
        },
        {
          key: "materiel",
          header: "Matériel actif",
          cell: (r) => (
            <Badge variant={r.materiel_actif > 0 ? "default" : "secondary"}>
              {r.materiel_actif}
            </Badge>
          ),
          sortValue: (r) => r.materiel_actif,
        },
      ]}
    />
  );
}
