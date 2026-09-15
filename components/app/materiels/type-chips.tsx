"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { MaterielIcon } from "@/lib/utils/materiel-icons";
import { cn } from "@/lib/utils";

type TypeChipsProps = {
  types: { label: string; value: string; count: number }[];
};

export function TypeChips({ types }: TypeChipsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeType = searchParams.get("type") ?? "all";

  const handleToggle = React.useCallback(
    (type: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (activeType === type) {
        params.delete("type");
      } else {
        params.set("type", type);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams, activeType]
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground mr-1 text-sm">Catégories :</span>

      <Badge
        className={cn(
          "cursor-pointer gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-all",
          activeType === "all"
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        )}
        onClick={() => handleToggle("all")}
      >
        <LayoutGrid className="size-3.5 shrink-0" aria-hidden />
        Tous
      </Badge>

      {types.map((type) => {
        const isActive = activeType === type.value;
        return (
          <Badge
            key={type.value}
            className={cn(
              "cursor-pointer gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-all",
              isActive
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
            onClick={() => handleToggle(type.value)}
          >
            <MaterielIcon type={type.value} className="size-3.5 shrink-0" />
            <span>{type.label}</span>
            <span className="text-xs opacity-70">({type.count})</span>
            {isActive ? <X className="size-3 shrink-0" aria-hidden /> : null}
          </Badge>
        );
      })}
    </div>
  );
}
