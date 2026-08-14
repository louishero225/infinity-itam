"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Laptop, Loader2, Search, User, FileKey } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchResults = {
  materiels: { id: string; code_materiel: string; type: string }[];
  employes: { id: string; prenom: string; nom: string; departement: string }[];
  licences: { id: string; nom: string; editeur: string | null }[];
};

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<SearchResults | null>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }

    const handle = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (response.ok) {
          setResults((await response.json()) as SearchResults);
          setOpen(true);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(handle);
  }, [query]);

  React.useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const hasResults =
    results &&
    (results.materiels.length > 0 || results.employes.length > 0 || results.licences.length > 0);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <div ref={rootRef} className="relative w-full max-w-md">
      <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results && setOpen(true)}
        placeholder="Rechercher un code, un employé, une licence…"
        className="pl-8"
        aria-label="Recherche globale"
      />
      {loading ? (
        <Loader2 className="text-muted-foreground absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin" />
      ) : null}

      {open && query.trim().length >= 2 ? (
        <div className="bg-popover absolute z-50 mt-1 w-full overflow-hidden rounded-md border shadow-md">
          {!hasResults ? (
            <p className="text-muted-foreground px-3 py-2 text-sm">Aucun résultat</p>
          ) : (
            <div className="max-h-80 overflow-y-auto py-1">
              {results.materiels.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={cn(
                    "hover:bg-accent flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                  )}
                  onClick={() => go(`/materiels/${m.id}`)}
                >
                  <Laptop className="size-4 shrink-0" />
                  <span className="font-medium">{m.code_materiel}</span>
                  <span className="text-muted-foreground truncate">{m.type}</span>
                </button>
              ))}
              {results.employes.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className="hover:bg-accent flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                  onClick={() => go(`/employes/${e.id}`)}
                >
                  <User className="size-4 shrink-0" />
                  <span className="font-medium">
                    {e.prenom} {e.nom}
                  </span>
                  <span className="text-muted-foreground truncate">{e.departement}</span>
                </button>
              ))}
              {results.licences.map((l) => (
                <Link
                  key={l.id}
                  href="/licences"
                  className="hover:bg-accent flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                  onClick={() => setOpen(false)}
                >
                  <FileKey className="size-4 shrink-0" />
                  <span className="font-medium">{l.nom}</span>
                  <span className="text-muted-foreground truncate">{l.editeur ?? ""}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
