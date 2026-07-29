"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";

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
      <span className="text-sm text-muted-foreground mr-1">Catégories:</span>
      
      <Badge
        className={`cursor-pointer text-sm rounded-sm p-2 m-2 transition-all ${
          activeType === "all"
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        }`}
        onClick={() => handleToggle("all")}
      >
        Tous
      </Badge>

      {types.map((type) => {
        const isActive = activeType === type.value;
        return (
          <Badge
            key={type.value}
            className={`cursor-pointer text-sm rounded-sm p-2 m-2 transition-all ${
              isActive
                ? "bg-primary  text-primary-foreground hover:bg-primary/90"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
            onClick={() => handleToggle(type.value)}
          >
            {type.label}
            <span className="ml-1.5 text-xs opacity-70">({type.count})</span>
            {isActive && <X className="ml-1 h-3 w-3" />}
          </Badge>
        );
      })}
    </div>
  );
}
