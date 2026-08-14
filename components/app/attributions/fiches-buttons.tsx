"use client";

import { useEffect, useState } from "react";
import { FicheRemiseMateriel } from "./fiche-remise-materiel";
import { FicheReceptionMateriel } from "./fiche-reception-materiel";
import { Loader2 } from "lucide-react";

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
  etat_remise?: string;
  etat_restitution?: string;
  accessoires?: string;
  commentaire?: string;
  beneficiaire_nom: string;
  beneficiaire_prenom?: string;
  beneficiaire_departement?: string;
  beneficiaire_type: string;
};

export function FichesButtons({ attributionId }: { attributionId: string }) {
  const [data, setData] = useState<FicheData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/attributions/${attributionId}/fiche`);
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des données");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [attributionId]);

  if (loading) {
    return (
      <div className="flex gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="flex gap-2">
      <FicheRemiseMateriel data={data} />
      <FicheReceptionMateriel data={data} />
      <a
        href={`/api/attributions/${attributionId}/pdf`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center text-xs underline"
      >
        PDF
      </a>
    </div>
  );
}
