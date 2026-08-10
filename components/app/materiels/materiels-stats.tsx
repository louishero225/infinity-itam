"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { StatCard } from "@/components/app/stat-card";
import { cn } from "@/lib/utils";

type StatsCardProps = {
  total: number;
  stock: number;
  attribues: number;
  maintenance: number;
  valeurTotale?: number;
};

export function MaterielsStats({ total, stock, attribues, maintenance, valeurTotale }: StatsCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeStatut = searchParams.get("statut") ?? "all";

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleFilter = React.useCallback(
    (statut: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (activeStatut === statut) {
        params.delete("statut");
      } else {
        params.set("statut", statut);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams, activeStatut]
  );

  const cards = [
    {
      label: "Total",
      value: total,
      hint: "matériels",
      statut: "all",
      hintExtra:
        valeurTotale != null && valeurTotale > 0 ? `Valeur : ${formatMoney(valeurTotale)}` : undefined,
    },
    {
      label: "Stock",
      value: stock,
      hint: "disponibles",
      statut: "Stock",
      accent: "success" as const,
    },
    {
      label: "Attribués",
      value: attribues,
      hint: "en utilisation",
      statut: "Attribué",
    },
    {
      label: "Maintenance",
      value: maintenance,
      hint: "en réparation",
      statut: "Maintenance",
      accent: "muted" as const,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const isActive = activeStatut === card.statut;
        return (
          <button
            key={card.statut}
            type="button"
            onClick={() => handleFilter(card.statut)}
            className="text-left"
          >
            <StatCard
              label={card.label}
              value={card.value}
              hint={card.hintExtra ?? card.hint}
              accent={card.accent}
              className={cn(
                "w-full",
                isActive && "ring-2 ring-primary/40 border-primary/30 shadow-md"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
