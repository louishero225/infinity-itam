"use client";

import { DataTable } from "@/components/app/data-table";
import { RestitutionModal } from "@/components/app/attributions/restitution-modal";
import { FichesButtons } from "@/components/app/attributions/fiches-buttons";
import { FicheOnboardingButton } from "@/components/app/attributions/fiche-onboarding-button";
import { Badge } from "@/components/ui/badge";
import {
  BeneficiaireBadge,
  beneficiaireSearchText,
  beneficiaireSortKey,
} from "@/components/app/beneficiaire/beneficiaire-badge";
import type { EntiteMini } from "@/lib/utils/beneficiaire";

type AttributionRow = {
  id: string;
  date_attribution: string;
  statut: string | null;
  type_attribution?: string | null;
  date_retour_prevue?: string | null;
  beneficiaire_type?: string | null;
  beneficiaire_label?: string | null;
  materiel: { id: string; code_materiel: string; type: string } | null;
  employe: { id: string; prenom: string; nom: string; departement: string } | null;
  entite?: EntiteMini | null;
};

export function AttributionsTable({ rows }: { rows: AttributionRow[] }) {
  return (
    <DataTable
      data={rows}
      getRowKey={(r) => r.id}
      searchPlaceholder="Rechercher (code matériel, employé, entité...)"
      columns={[
        {
          key: "materiel",
          header: "Matériel",
          cell: (r) => r.materiel?.code_materiel ?? "—",
          searchableText: (r) => `${r.materiel?.code_materiel ?? ""} ${r.materiel?.type ?? ""}`,
          sortValue: (r) => r.materiel?.code_materiel ?? "",
        },
        {
          key: "employe",
          header: "Destinataire",
          cell: (r) => (
            <BeneficiaireBadge
              beneficiaire_type={r.beneficiaire_type}
              beneficiaire_label={r.beneficiaire_label}
              employe={r.employe}
              entite={r.entite}
            />
          ),
          searchableText: (r) =>
            beneficiaireSearchText({
              beneficiaire_type: r.beneficiaire_type,
              beneficiaire_label: r.beneficiaire_label,
              employe: r.employe,
              entite: r.entite,
            }),
          sortValue: (r) =>
            beneficiaireSortKey({
              beneficiaire_type: r.beneficiaire_type,
              beneficiaire_label: r.beneficiaire_label,
              employe: r.employe,
              entite: r.entite,
            }),
        },
        {
          key: "date",
          header: "Date",
          cell: (r) => r.date_attribution,
          searchableText: (r) => r.date_attribution,
          sortValue: (r) => r.date_attribution,
        },
        {
          key: "statut",
          header: "Statut",
          cell: (r) => (
            <div className="flex flex-col gap-1">
              <span>{r.statut ?? "—"}</span>
              {r.type_attribution === "pret" ? (
                <Badge variant="secondary">
                  Prêt{r.date_retour_prevue ? ` · ${r.date_retour_prevue}` : ""}
                </Badge>
              ) : null}
            </div>
          ),
          sortValue: (r) => r.statut ?? "",
        },
        {
          key: "fiches",
          header: "Fiches",
          sortable: false,
          cell: (r) => (
            <div className="flex flex-wrap items-center gap-2">
              <FichesButtons attributionId={r.id} />
              {r.employe ? <FicheOnboardingButton employeId={r.employe.id} label="Kit" /> : null}
            </div>
          ),
        },
        {
          key: "actions",
          header: "Actions",
          sortable: false,
          cell: (r) =>
            r.materiel ? (
              <RestitutionModal attributionId={r.id} materielId={r.materiel.id} />
            ) : null,
        },
      ]}
    />
  );
}
