"use client";

import { DataTable } from "@/components/app/data-table";
import { RestitutionModal } from "@/components/app/attributions/restitution-modal";
import { FichesButtons } from "@/components/app/attributions/fiches-buttons";

type AttributionRow = {
  id: string;
  date_attribution: string;
  statut: string | null;
  beneficiaire_type?: string | null;
  beneficiaire_label?: string | null;
  materiel: { id: string; code_materiel: string; type: string } | null;
  employe: { id: string; prenom: string; nom: string; departement: string } | null;
};

export function AttributionsTable({ rows }: { rows: AttributionRow[] }) {
  return (
    <DataTable
      data={rows}
      searchPlaceholder="Rechercher (code matériel, employé, département...)"
      columns={[
        {
          key: "materiel",
          header: "Matériel",
          cell: (r) => r.materiel?.code_materiel ?? "—",
          searchableText: (r) => `${r.materiel?.code_materiel ?? ""} ${r.materiel?.type ?? ""}`,
        },
        {
          key: "employe",
          header: "Bénéficiaire",
          cell: (r) => {
            if (r.employe) {
              return `${r.employe.prenom} ${r.employe.nom} (${r.employe.departement})`;
            }

            if (r.beneficiaire_type === "societe") {
              return r.beneficiaire_label ?? "Société";
            }

            if (r.beneficiaire_type === "departement") {
              return r.beneficiaire_label ?? "Département";
            }

            return "—";
          },
          searchableText: (r) => {
            if (r.employe) {
              return `${r.employe.prenom} ${r.employe.nom} ${r.employe.departement}`;
            }
            return `${r.beneficiaire_type ?? ""} ${r.beneficiaire_label ?? ""}`;
          },
        },
        {
          key: "date",
          header: "Date",
          cell: (r) => r.date_attribution,
          searchableText: (r) => r.date_attribution,
        },
        {
          key: "fiches",
          header: "Fiches",
          cell: (r) => <FichesButtons attributionId={r.id} />,
        },
        {
          key: "actions",
          header: "Actions",
          cell: (r) => (r.materiel ? <RestitutionModal attributionId={r.id} materielId={r.materiel.id} /> : null),
        },
      ]}
    />
  );
}
