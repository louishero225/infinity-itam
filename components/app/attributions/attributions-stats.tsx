"use client";

import { StatCard } from "@/components/app/stat-card";

type AttributionsStatsProps = {
  total: number;
  parEmploye: number;
  parDepartement: number;
  parSociete: number;
  dureeeMoyenne?: number;
};

export function AttributionsStats({
  total,
  parEmploye,
  parDepartement,
  dureeeMoyenne,
}: Omit<AttributionsStatsProps, "parSociete"> & { parSociete?: number }) {
  const formatDuree = (jours: number | undefined) => {
    if (!jours) return "—";
    if (jours < 30) return `${Math.round(jours)} j`;
    if (jours < 365) return `${Math.round(jours / 30)} mois`;
    return `${(jours / 365).toFixed(1)} an`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total actif" value={total} hint="attributions" />
      <StatCard
        label="Par employé"
        value={parEmploye}
        hint={`${total > 0 ? Math.round((parEmploye / total) * 100) : 0} % du total`}
        accent="success"
      />
      <StatCard
        label="Par département"
        value={parDepartement}
        hint={`${total > 0 ? Math.round((parDepartement / total) * 100) : 0} % du total`}
      />
      <StatCard
        label="Durée moyenne"
        value={formatDuree(dureeeMoyenne)}
        hint="possession"
        accent="muted"
      />
    </div>
  );
}
