"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type Option = { label: string; value: string };

function setParam(params: URLSearchParams, key: string, value: string | null) {
  if (!value || value === "all") params.delete(key);
  else params.set(key, value);
}

export function MaterielsFilters({
  types,
  sites,
}: {
  types: Option[];
  sites: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const type = searchParams.get("type") ?? "all";
  const statut = searchParams.get("statut") ?? "all";
  const etat = searchParams.get("etat") ?? "all";
  const site = searchParams.get("site") ?? "all";
  const search = searchParams.get("search") ?? "";

  const update = React.useCallback(
    (next: { type?: string; statut?: string; etat?: string; site?: string; search?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.type !== undefined) setParam(params, "type", next.type);
      if (next.statut !== undefined) setParam(params, "statut", next.statut);
      if (next.etat !== undefined) setParam(params, "etat", next.etat);
      if (next.site !== undefined) setParam(params, "site", next.site);
      if (next.search !== undefined) setParam(params, "search", next.search);

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams]
  );

  const reset = React.useCallback(() => {
    router.replace(pathname);
  }, [pathname, router]);

  const [showAdvanced, setShowAdvanced] = React.useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[250px]">
          <Input
            placeholder="Rechercher (code, marque, modèle, série...)"
            value={search}
            onChange={(e) => update({ search: e.target.value })}
            className="h-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={statut} onValueChange={(v) => update({ statut: v })}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="Stock">Stock</SelectItem>
              <SelectItem value="Attribué">Attribué</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
              <SelectItem value="Transit">Transit</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="h-9"
          >
            Plus de filtres
            <ChevronDown
              className={`ml-1 h-4 w-4 transition-transform ${
                showAdvanced ? "rotate-180" : ""
              }`}
            />
          </Button>

          {(type !== "all" || etat !== "all" || site !== "all" || statut !== "all" || search) && (
            <Button variant="ghost" size="sm" onClick={reset} className="h-9">
              Réinitialiser
            </Button>
          )}
        </div>
      </div>

      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
          <Select value={type} onValueChange={(v) => update({ type: v })}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {types.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={etat} onValueChange={(v) => update({ etat: v })}>
            <SelectTrigger className="w-[160px] h-9">
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

          <Select value={site} onValueChange={(v) => update({ site: v })}>
            <SelectTrigger className="w-[160px] h-9">
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
      )}
    </div>
  );
}
