"use client";

import { useState } from "react";
import { FicheRemiseMateriel } from "./fiche-remise-materiel";
import { FicheReceptionMateriel } from "./fiche-reception-materiel";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";

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

/** Charge la fiche à la demande (évite N appels API au chargement du tableau). */
export function FichesButtons({ attributionId }: { attributionId: string }) {
  const [data, setData] = useState<FicheData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ensureLoaded() {
    if (data || loading) return data;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/attributions/${attributionId}/fiche`);
      if (!response.ok) throw new Error("Erreur de chargement");
      const result = (await response.json()) as FicheData;
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      return null;
    } finally {
      setLoading(false);
    }
  }

  if (error && !data) {
    return (
      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => void ensureLoaded()}>
        Réessayer
      </Button>
    );
  }

  if (data) {
    return (
      <div className="flex flex-wrap gap-2">
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

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 gap-1 text-xs"
      disabled={loading}
      onClick={() => void ensureLoaded()}
    >
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : <FileText className="size-3.5" />}
      Fiches
    </Button>
  );
}
