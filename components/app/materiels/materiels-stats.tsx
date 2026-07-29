"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      description: "matériels",
      statut: "all",
      borderColor: "border-l-slate-500",
    },
    {
      label: "Stock",
      value: stock,
      description: "disponibles",
      statut: "Stock",
      borderColor: "border-l-green-500",
    },
    {
      label: "Attribués",
      value: attribues,
      description: "en utilisation",
      statut: "Attribué",
      borderColor: "border-l-blue-500",
    },
    {
      label: "Maintenance",
      value: maintenance,
      description: "en réparation",
      statut: "Maintenance",
      borderColor: "border-l-yellow-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const isActive = activeStatut === card.statut;
        return (
          <Card
            key={card.statut}
            className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${
              card.borderColor
            } ${isActive ? "ring-2 ring-primary shadow-md" : ""}`}
            onClick={() => handleFilter(card.statut)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{card.value}</div>
              <p className="text-muted-foreground text-xs mt-1">{card.description}</p>
              {card.statut === "all" && valeurTotale != null && valeurTotale > 0 && (
                <p className="text-muted-foreground text-xs mt-1 font-medium">
                  Valeur: {formatMoney(valeurTotale)}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
