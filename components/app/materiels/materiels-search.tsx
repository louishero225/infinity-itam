"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback } from "react";

export function MaterielsSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = searchParams.get("search") ?? "";

  const handleSearch = useCallback(
    (searchValue: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchValue.trim()) {
        params.set("search", searchValue.trim());
      } else {
        params.delete("search");
      }
      router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname);
    },
    [pathname, router, searchParams]
  );

  const handleClear = () => {
    handleSearch("");
  };

  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Rechercher code, marque, modèle, n° série..."
        defaultValue={value}
        key={value}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-9 pr-9"
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
