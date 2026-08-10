"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type AttributionsFiltersProps = {
  departements: string[];
  types: string[];
};

const DESTINATAIRE_OPTIONS = [
  { value: "employe", label: "Par employé" },
  { value: "entite", label: "Par entité" },
] as const;

export function AttributionsFilters({ departements, types }: AttributionsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeDept = searchParams.get("departement");
  const activeType = searchParams.get("type");
  const activeDestinataire = searchParams.get("destinataire");

  const handleFilter = (key: "departement" | "type" | "destinataire", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.get(key);

    if (current === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  };

  const handleClearAll = () => {
    router.replace(pathname);
  };

  const hasFilters = activeDept || activeType || activeDestinataire;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Destinataire:</span>
        {DESTINATAIRE_OPTIONS.map((opt) => {
          const isActive = activeDestinataire === opt.value;
          return (
            <Badge
              key={opt.value}
              variant={isActive ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => handleFilter("destinataire", opt.value)}
            >
              {opt.label}
              {isActive && <X className="ml-1 h-3 w-3" />}
            </Badge>
          );
        })}
      </div>

      {departements.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Département employé:</span>
          {departements.map((dept) => {
            const isActive = activeDept === dept;
            return (
              <Badge
                key={dept}
                variant={isActive ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => handleFilter("departement", dept)}
              >
                {dept}
                {isActive && <X className="ml-1 h-3 w-3" />}
              </Badge>
            );
          })}
        </div>
      )}

      {types.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Type matériel:</span>
          {types.map((type) => {
            const isActive = activeType === type;
            return (
              <Badge
                key={type}
                variant={isActive ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => handleFilter("type", type)}
              >
                {type}
                {isActive && <X className="ml-1 h-3 w-3" />}
              </Badge>
            );
          })}
        </div>
      )}

      {hasFilters && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={handleClearAll}>
            <X className="mr-1 h-4 w-4" />
            Réinitialiser les filtres
          </Button>
        </div>
      )}
    </div>
  );
}
