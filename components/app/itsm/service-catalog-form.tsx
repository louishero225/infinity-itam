"use client";

import * as React from "react";
import { ArrowLeft, Send } from "lucide-react";

import { CATALOG_GROUPS, SERVICE_CATALOG, type ServiceCatalogItem } from "@/lib/itsm/catalog";
import { ITSM_ENTITES } from "@/lib/itsm/constants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  contactEmail?: string | null;
  defaultEntite?: string;
};

export function ServiceCatalogForm({ action, contactEmail, defaultEntite = "IAG" }: Props) {
  const [selected, setSelected] = React.useState<ServiceCatalogItem | null>(null);
  const [description, setDescription] = React.useState("");
  const [entite, setEntite] = React.useState(defaultEntite);
  const [groupFilter, setGroupFilter] = React.useState<string>("Tous");

  function pick(item: ServiceCatalogItem) {
    setSelected(item);
    setDescription(item.descriptionTemplate);
  }

  const items =
    groupFilter === "Tous"
      ? SERVICE_CATALOG
      : SERVICE_CATALOG.filter((i) => i.group === groupFilter);

  if (selected) {
    return (
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-start gap-3 border-b px-5 py-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-0.5 shrink-0"
            onClick={() => {
              setSelected(null);
              setDescription("");
            }}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
              Catalogue · {selected.group}
            </p>
            <h2 className="text-sm font-semibold">{selected.title}</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">{selected.summary}</p>
          </div>
        </div>

        <form action={action} className="grid gap-4 px-5 py-5">
          <input type="hidden" name="categorie" value={selected.categorie} />
          <input type="hidden" name="priorite" value={selected.priorite} />
          <input type="hidden" name="catalog_id" value={selected.id} />
          {contactEmail ? <input type="hidden" name="contact_email" value={contactEmail} /> : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-muted/30 px-3 py-2">
              <p className="text-muted-foreground text-[10px] font-semibold uppercase">Catégorie</p>
              <p className="text-sm font-medium">{selected.categorie}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 px-3 py-2">
              <p className="text-muted-foreground text-[10px] font-semibold uppercase">Priorité</p>
              <p className="text-sm font-medium">{selected.priorite}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entite">Entité / site</Label>
            <select
              id="entite"
              name="entite"
              value={entite}
              onChange={(e) => setEntite(e.target.value)}
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
            >
              {ITSM_ENTITES.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Complétez la description</Label>
            <Textarea
              id="description"
              name="description"
              rows={8}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none font-mono text-sm"
            />
          </div>

          <Button type="submit" className="gap-2 self-start">
            <Send className="size-4" />
            Envoyer la demande
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="border-b px-5 py-4">
        <h2 className="text-sm font-semibold">Catalogue de services</h2>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Choisissez un type de demande — comme sur Jira Service Management / Freshservice.
        </p>
        <div className="mt-3 flex flex-wrap gap-1">
          {["Tous", ...CATALOG_GROUPS.filter((g) => SERVICE_CATALOG.some((i) => i.group === g))].map(
            (g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroupFilter(g)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  groupFilter === g
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {g}
              </button>
            )
          )}
        </div>
      </div>

      <div className="grid gap-2 p-3 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => pick(item)}
              className="hover:border-sky-300 hover:bg-sky-50/50 dark:hover:border-sky-800 dark:hover:bg-sky-950/20 flex items-start gap-3 rounded-xl border bg-background p-3 text-left transition-colors"
            >
              <span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                <Icon className="text-foreground/80 size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{item.title}</span>
                <span className="text-muted-foreground mt-0.5 block text-xs leading-snug">
                  {item.summary}
                </span>
                <span className="text-muted-foreground mt-1 block text-[10px] font-medium tracking-wide uppercase">
                  {item.priorite} · {item.categorie}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
