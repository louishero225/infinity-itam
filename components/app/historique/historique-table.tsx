"use client";

import * as React from "react";
import { DataTable } from "@/components/app/data-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText } from "lucide-react";
import { FicheRemiseMateriel } from "@/components/app/attributions/fiche-remise-materiel";
import { FicheReceptionMateriel } from "@/components/app/attributions/fiche-reception-materiel";

type HistoriqueRow = {
  id: string | null;
  code_materiel: string | null;
  prenom: string | null;
  nom: string | null;
  date_attribution: string | null;
  date_restitution: string | null;
  statut: string | null;
  action: string | null;
};

type FicheData = {
  attribution_id: string;
  numero_attribution?: string;
  date_attribution: string;
  date_restitution?: string;
  code_materiel: string;
  type_materiel: string;
  marque?: string;
  modele?: string;
  numero_serie?: string;
  etat_restitution?: string;
  commentaire?: string;
  beneficiaire_nom: string;
  beneficiaire_prenom?: string;
  beneficiaire_departement?: string;
  beneficiaire_type: string;
  checklist_items?: string[];
  decision_it?: "bon_etat" | "avec_reserves" | "reparation" | "reformer";
};

export function HistoriqueTable({ rows }: { rows: HistoriqueRow[] }) {
  const [openFiche, setOpenFiche] = React.useState(false);
  const [ficheData, setFicheData] = React.useState<FicheData | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleOpenFiche = async (attributionId: string | null) => {
    if (!attributionId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/attributions/${attributionId}/fiche`);
      if (response.ok) {
        const data = await response.json();
        setFicheData(data);
        setOpenFiche(true);
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la fiche", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DataTable
        data={rows}
        getRowKey={(r) => r.id ?? `${r.code_materiel}-${r.date_attribution}`}
        searchPlaceholder="Rechercher (code matériel, employé, statut...)"
        columns={[
        {
          key: "code",
          header: "Matériel",
          cell: (r) => r.code_materiel ?? "—",
          searchableText: (r) => r.code_materiel ?? "",
          sortValue: (r) => r.code_materiel,
        },
        {
          key: "employe",
          header: "Employé",
          cell: (r) => `${r.prenom ?? ""} ${r.nom ?? ""}`.trim() || "—",
          searchableText: (r) => `${r.prenom ?? ""} ${r.nom ?? ""}`,
          sortValue: (r) => `${r.nom ?? ""} ${r.prenom ?? ""}`.trim(),
        },
        {
          key: "date",
          header: "Date attribution",
          cell: (r) => r.date_attribution ?? "—",
          searchableText: (r) => r.date_attribution ?? "",
          sortValue: (r) => r.date_attribution,
        },
        {
          key: "retour",
          header: "Retour",
          cell: (r) => r.date_restitution ?? "—",
          searchableText: (r) => r.date_restitution ?? "",
          sortValue: (r) => r.date_restitution,
        },
        {
          key: "statut",
          header: "Statut",
          cell: (r) => r.statut ?? "—",
          searchableText: (r) => r.statut ?? "",
          sortValue: (r) => r.statut,
        },
        {
          key: "action",
          header: "Action",
          cell: (r) => r.action ?? "—",
          sortValue: (r) => r.action,
        },
        {
          key: "actions",
          header: "Actions",
          sortable: false,
          cell: (r) => (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenFiche(r.id)}
              disabled={isLoading}
            >
              <FileText className="h-4 w-4 mr-1" />
              Fiche
            </Button>
          ),
        },
      ]}
      />

      {/* Dialog pour afficher la fiche */}
      {openFiche && ficheData && (
        <Dialog open={openFiche} onOpenChange={setOpenFiche}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {ficheData.date_restitution
                  ? "Fiche de Réception - Restitution"
                  : "Fiche de Remise - Attribution"}
              </DialogTitle>
            </DialogHeader>
            {ficheData.date_restitution ? (
              <FicheReceptionMateriel data={ficheData} />
            ) : (
              <FicheRemiseMateriel data={ficheData} />
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
