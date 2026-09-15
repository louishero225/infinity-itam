"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  ACCESSOIRE_SOUS_CATEGORIES,
  AccessoireSousIcon,
} from "@/lib/utils/accessoire-sous-categories";
import { cn } from "@/lib/utils";

type Props = {
  counts: Record<string, number>;
};

export function AccessoireSousChips({ counts }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const active = searchParams.get("sous") ?? "all";

  const handleToggle = React.useCallback(
    (sous: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (active === sous || sous === "all") {
        params.delete("sous");
      } else {
        params.set("sous", sous);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams, active]
  );

  const total = Object.values(counts).reduce((s, n) => s + n, 0);

  return (
    <div className="flex flex-wrap items-center gap-2 border-t pt-3">
      <span className="text-muted-foreground mr-1 text-sm">Sous-catégories :</span>

      <Badge
        className={cn(
          "cursor-pointer gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-all",
          active === "all"
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        )}
        onClick={() => handleToggle("all")}
      >
        Toutes
        <span className="text-xs opacity-70">({total})</span>
      </Badge>

      {ACCESSOIRE_SOUS_CATEGORIES.map((sous) => {
        const count = counts[sous] ?? 0;
        if (count === 0 && active !== sous) return null;
        const isActive = active === sous;
        return (
          <Badge
            key={sous}
            className={cn(
              "cursor-pointer gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-all",
              isActive
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
            onClick={() => handleToggle(sous)}
          >
            <AccessoireSousIcon sous={sous} className="size-3.5 shrink-0" />
            <span>{sous}</span>
            <span className="text-xs opacity-70">({count})</span>
            {isActive ? <X className="size-3 shrink-0" aria-hidden /> : null}
          </Badge>
        );
      })}
    </div>
  );
}
