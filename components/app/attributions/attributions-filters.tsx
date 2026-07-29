"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type AttributionsFiltersProps = {
  departements: string[];
  types: string[];
};

export function AttributionsFilters({ departements, types }: AttributionsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeDept = searchParams.get("departement");
  const activeType = searchParams.get("type");

  const handleFilter = (key: "departement" | "type", value: string) => {
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

  const hasFilters = activeDept || activeType;

  return (
    <div className="space-y-3">
      {/* Filtres département */}
      {departements.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Département:</span>
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

      {/* Filtres type matériel */}
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

      {/* Bouton réinitialiser */}
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
