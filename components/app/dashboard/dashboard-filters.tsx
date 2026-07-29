"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option = { label: string; value: string };

function setParam(params: URLSearchParams, key: string, value: string | null) {
  if (!value || value === "all") params.delete(key);
  else params.set(key, value);
}

export function DashboardFilters({
  sites,
  defaultTop,
}: {
  sites: Option[];
  defaultTop: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const statut = searchParams.get("statut") ?? "all";
  const etat = searchParams.get("etat") ?? "all";
  const site = searchParams.get("site") ?? "all";
  const top = searchParams.get("top") ?? String(defaultTop);

  const update = React.useCallback(
    (next: { statut?: string; etat?: string; site?: string; top?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.statut !== undefined) setParam(params, "statut", next.statut);
      if (next.etat !== undefined) setParam(params, "etat", next.etat);
      if (next.site !== undefined) setParam(params, "site", next.site);
      if (next.top !== undefined) setParam(params, "top", next.top);

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams]
  );

  const reset = React.useCallback(() => {
    router.replace(pathname);
  }, [pathname, router]);

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="min-w-[170px]">
        <Select value={site} onValueChange={(v) => update({ site: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Site" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les sites</SelectItem>
            {sites.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[170px]">
        <Select value={statut} onValueChange={(v) => update({ statut: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="Stock">Stock</SelectItem>
            <SelectItem value="Attribué">Attribué</SelectItem>
            <SelectItem value="Maintenance">Maintenance</SelectItem>
            <SelectItem value="Transit">Transit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[170px]">
        <Select value={etat} onValueChange={(v) => update({ etat: v })}>
          <SelectTrigger>
            <SelectValue placeholder="État" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les états</SelectItem>
            <SelectItem value="Neuf">Neuf</SelectItem>
            <SelectItem value="Bon">Bon</SelectItem>
            <SelectItem value="Moyen">Moyen</SelectItem>
            <SelectItem value="À réparer">À réparer</SelectItem>
            <SelectItem value="Hors service">Hors service</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[170px]">
        <Select value={top} onValueChange={(v) => update({ top: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Top" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">Top 5</SelectItem>
            <SelectItem value="10">Top 10</SelectItem>
            <SelectItem value="15">Top 15</SelectItem>
            <SelectItem value="25">Top 25</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" onClick={reset}>
        Réinitialiser
      </Button>
    </div>
  );
}
