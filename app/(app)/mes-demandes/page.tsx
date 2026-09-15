import Link from "next/link";
import { redirect } from "next/navigation";
import { LifeBuoy } from "lucide-react";

import {
  ItsmStatutBadge,
  ticketRefLabel,
} from "@/components/app/itsm/itsm-status";
import { ItsmSlaClock } from "@/components/app/itsm/itsm-sla-clock";
import { ServiceCatalogForm } from "@/components/app/itsm/service-catalog-form";
import { Button } from "@/components/ui/button";
import { employeDisplayName } from "@/lib/utils/employe-matching";
import { cn } from "@/lib/utils";

import { createDemandeFromForm, listMesDemandes } from "./actions";

export default async function MesDemandesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const params = await searchParams;
  const { tickets, employe, access } = await listMesDemandes().catch(() => {
    redirect("/login?redirectTo=/mes-demandes");
  });

  if (!access.canRequestTicket) {
    redirect("/login?redirectTo=/mes-demandes");
  }

  const openCount = tickets.filter((t) => t.statut === "Ouvert" || t.statut === "En cours").length;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-50 via-white to-sky-50 px-6 py-7 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 90% 10%, rgb(14 165 233 / 0.15), transparent 45%)",
          }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex gap-3">
            <div className="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200 flex size-11 shrink-0 items-center justify-center rounded-xl">
              <LifeBuoy className="size-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
                Portail collaborateur
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">Mes demandes</h1>
              <p className="text-muted-foreground mt-1 max-w-lg text-sm">
                {employe
                  ? `${employeDisplayName(employe.prenom, employe.nom)} · ${employe.departement}`
                  : access.email
                    ? `Compte ${access.email}`
                    : "Catalogue de services IT"}
              </p>
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Ouvertes</p>
              <p className="text-xl font-semibold tabular-nums">{openCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Total</p>
              <p className="text-xl font-semibold tabular-nums">{tickets.length}</p>
            </div>
          </div>
        </div>
      </header>

      {params.created ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
          Demande envoyée. L&apos;équipe IT vous répondra dès que possible.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <ServiceCatalogForm
          action={createDemandeFromForm}
          contactEmail={access.email}
          defaultEntite={employe?.site && ["IAC", "IAF", "IAP", "IAV", "IAT", "IAG"].includes(employe.site) ? employe.site : "IAG"}
        />

        <section className="rounded-xl border bg-card shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="text-sm font-semibold">Suivi</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">Vos dernières demandes</p>
          </div>
          <div className="divide-y">
            {tickets.length === 0 ? (
              <p className="text-muted-foreground px-5 py-10 text-center text-sm">
                Aucune demande — choisissez un service dans le catalogue.
              </p>
            ) : (
              tickets.map((t) => (
                <div
                  key={t.id}
                  className={cn(
                    "flex flex-col gap-2 px-5 py-3.5",
                    t.en_retard && "bg-red-50/40 dark:bg-red-950/10"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.categorie}</p>
                      <p className="text-muted-foreground font-mono text-[11px] tabular-nums">
                        {ticketRefLabel(t)} · {t.date}
                      </p>
                    </div>
                    <ItsmStatutBadge statut={t.statut} />
                  </div>
                  <ItsmSlaClock
                    date={t.date}
                    heure_creation={t.heure_creation}
                    resolved_at={t.resolved_at}
                    statut={t.statut}
                    priorite={t.priorite}
                    compact
                  />
                  <p className="text-muted-foreground line-clamp-2 text-xs">
                    {t.description ?? "—"}
                  </p>
                  {access.isStaff ? (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto self-start px-0 text-xs"
                      asChild
                    >
                      <Link href={`/itsm/tickets/${t.id}`}>Voir en console</Link>
                    </Button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
