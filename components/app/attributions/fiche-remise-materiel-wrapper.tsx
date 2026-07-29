"use client";

import { FicheRemiseMateriel } from "./fiche-remise-materiel";

type FicheData = {
  attribution_id: string;
  numero_attribution?: string;
  date_attribution: string;
  code_materiel: string;
  type_materiel: string;
  marque?: string;
  modele?: string;
  numero_serie?: string;
  etat_remise?: string;
  accessoires?: string;
  beneficiaire_nom: string;
  beneficiaire_prenom?: string;
  beneficiaire_departement?: string;
  beneficiaire_type: string;
};

export function FicheRemiseMaterielWrapper({ data }: { data: FicheData }) {
  return <FicheRemiseMateriel data={data} />;
}
