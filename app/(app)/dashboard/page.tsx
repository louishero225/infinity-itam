import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Laptop,
  Plus,
  Ticket,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/app/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";
import { getAccess } from "@/lib/auth/roles";
import {
  getFaitsMarquantsToday,
  getItsmStats,
  listTickets,
} from "@/app/(app)/itsm/actions";
import { redirect } from "next/navigation";

type SyntheseRow = Tables<"v_direction_synthese">;

function formatMoney(value: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(value);
}

function statutBadgeVariant(statut: string) {
  if (statut === "Ouvert" || statut === "En cours") return "default" as const;
  if (statut === "Résolu" || statut === "Fermé") return "secondary" as const;
  return "outline" as const;
}

export default async function DashboardPage() {
  const access = await getAccess().catch(() => null);
  if (access?.isCollaborateurOnly) {
    redirect("/mes-demandes");
  }
  const supabase = await createSupabaseServerClient();

  const [
    { data: synthese },
    { count: alertesCount },
    stats,
    tickets,
    faits,
  ] = await Promise.all([
    supabase.from("v_direction_synthese").select("*").maybeSingle<SyntheseRow>(),
    supabase
      .from("alertes")
      .select("*", { count: "exact", head: true })
      .eq("statut", "active"),
    getItsmStats().catch(() => ({ total: 0, ouverts: 0, enRetard: 0, resolus: 0 })),
    listTickets().catch(() => []),
    getFaitsMarquantsToday().catch(() => ""),
  ]);

  const recentTickets = tickets.slice(0, 8);
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Hero accueil */}
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-8 text-white shadow-lg md:px-8 md:py-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgb(56 189 248 / 0.4), transparent 50%), radial-gradient(circle at 80% 20%, rgb(99 102 241 / 0.3), transparent 40%)",
          }}
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="text-sm font-medium text-slate-300 capitalize">{today}</p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Centre de support IT
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed md:text-base">
              Gérez les tickets, le SLA et le parc informatique depuis une seule plateforme.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-white text-slate-900 hover:bg-slate-100">
              <Link href="/itsm?tab=nouveau">
                <Plus className="size-4" />
                Nouveau ticket
              </Link>
            </Button>
            <Button asChild variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
              <Link href="/mes-demandes">
                Portail demandes
              </Link>
            </Button>
            <Button asChild variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
              <Link href="/itsm">
                <Ticket className="size-4" />
                Voir les tickets
              </Link>
            </Button>
            <Button asChild variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
              <Link href="/materiels">
                <Laptop className="size-4" />
                Parc matériel
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* KPIs Support IT */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight">Support IT</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/itsm">
              Tout voir
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total tickets" value={stats.total} href="/itsm" />
          <StatCard
            label="À traiter"
            value={stats.ouverts}
            hint="ouverts / en cours"
            accent={stats.ouverts > 0 ? "warning" : "success"}
            href="/itsm"
          />
          <StatCard
            label="En retard SLA"
            value={stats.enRetard}
            hint="> 30 jours"
            accent={stats.enRetard > 0 ? "danger" : "success"}
            href="/itsm"
          />
          <StatCard
            label="Clôturés"
            value={stats.resolus}
            hint="résolus / fermés"
            accent="muted"
            href="/itsm"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Tickets récents */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
            <div>
              <CardTitle className="text-base">Tickets récents</CardTitle>
              <CardDescription>Dernières demandes de support</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/itsm">Liste complète</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Demandeur</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                      Aucun ticket.{" "}
                      <Link href="/itsm?tab=nouveau" className="text-primary underline-offset-4 hover:underline">
                        Créer le premier
                      </Link>
                    </TableCell>
                  </TableRow>
                ) : (
                  recentTickets.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {t.date}
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate">{t.demandeur}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[120px] truncate text-sm">
                        {t.categorie}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statutBadgeVariant(t.statut)}>{t.statut}</Badge>
                        {t.en_retard ? (
                          <Badge variant="destructive" className="ml-1">
                            SLA
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/itsm/tickets/${t.id}`}>Ouvrir</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Colonne droite : faits marquants + parc */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Faits marquants du jour</CardTitle>
              <CardDescription>Notes d&apos;équipe support</CardDescription>
            </CardHeader>
            <CardContent>
              {faits ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{faits}</p>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Aucune note aujourd&apos;hui.{" "}
                  <Link href="/itsm?tab=outils" className="text-primary underline-offset-4 hover:underline">
                    Ajouter
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Laptop className="text-muted-foreground size-4" />
                <CardTitle className="text-base">Parc informatique</CardTitle>
              </div>
              <CardDescription>Synthèse ITAM</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-muted-foreground text-xs">Matériel</p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {synthese?.total_materiels ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-muted-foreground text-xs">En stock</p>
                  <p className="text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {synthese?.materiels_en_stock ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-muted-foreground text-xs">Attribués</p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {synthese?.materiels_attribues ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-muted-foreground text-xs">Valeur parc</p>
                  <p className="text-lg font-semibold tabular-nums">
                    {formatMoney(synthese?.cout_total_parc ?? null)}
                  </p>
                </div>
              </div>

              {(alertesCount ?? 0) > 0 ? (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>
                    {alertesCount} alerte{(alertesCount ?? 0) > 1 ? "s" : ""} active
                    {(alertesCount ?? 0) > 1 ? "s" : ""}
                  </span>
                  <Button variant="link" size="sm" className="ml-auto h-auto p-0" asChild>
                    <Link href="/alertes">Voir</Link>
                  </Button>
                </div>
              ) : null}

              <div className="flex flex-col gap-2 pt-1">
                <Button variant="outline" size="sm" className="justify-start" asChild>
                  <Link href="/parc">
                    <BarChart3 className="size-4" />
                    Analytics parc
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="justify-start" asChild>
                  <Link href="/employes">
                    <Users className="size-4" />
                    Collaborateurs
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
