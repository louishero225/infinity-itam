import type { Tables } from "@/lib/types/database";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HistoriqueTable } from "@/components/app/historique/historique-table";

type HistoriqueRow = Tables<"v_historique_attributions">;

export default async function HistoriquePage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createSupabaseServerClient();

  // Filtres
  const periodeFilter = typeof searchParams?.periode === "string" ? searchParams.periode : "3m";
  const actionFilter = typeof searchParams?.action === "string" ? searchParams.action : "all";
  const pageParam = typeof searchParams?.page === "string" ? parseInt(searchParams.page, 10) : 1;
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const itemsPerPage = 50;

  // Calculer date limite selon période
  const now = new Date();
  let dateDebut: Date | null = null;
  switch (periodeFilter) {
    case "7j":
      dateDebut = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30j":
      dateDebut = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "3m":
      dateDebut = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "6m":
      dateDebut = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      break;
    case "1an":
      dateDebut = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case "tout":
      dateDebut = null;
      break;
  }

  // Requête avec filtres et pagination
  let query = supabase
    .from("v_historique_attributions")
    .select("*", { count: "exact" });

  if (dateDebut) {
    query = query.gte("date_action", dateDebut.toISOString().split("T")[0]);
  }

  if (actionFilter !== "all") {
    query = query.eq("action", actionFilter);
  }

  const { data, error, count } = await query
    .order("date_action", { ascending: false })
    .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)
    .returns<HistoriqueRow[]>();

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Historique</h1>
        <p className="text-destructive text-sm">{error.message}</p>
      </div>
    );
  }

  const rows = data ?? [];
  const totalItems = count ?? 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Stats
  const stats = {
    total: totalItems,
    attributions: rows.filter((r) => r.action === "Attribution").length,
    restitutions: rows.filter((r) => r.action === "Restitution").length,
  };

  // Stats mensuelles (dernières 6 mois)
  const statsParMois: Record<string, { attributions: number; restitutions: number }> = {};
  const sixMoisAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  
  rows.forEach((r) => {
    if (!r.date_action) return;
    const date = new Date(r.date_action);
    if (date < sixMoisAgo) return;
    
    const mois = date.toLocaleDateString("fr-FR", { year: "numeric", month: "short" });
    if (!statsParMois[mois]) {
      statsParMois[mois] = { attributions: 0, restitutions: 0 };
    }
    
    if (r.action === "Attribution") {
      statsParMois[mois].attributions++;
    } else if (r.action === "Restitution") {
      statsParMois[mois].restitutions++;
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Historique</h1>
        <p className="text-muted-foreground text-sm">
          Historique complet des attributions et restitutions avec filtres et pagination.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Total opérations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-muted-foreground text-xs mt-1">
              {periodeFilter === "tout" ? "toutes périodes" : `dernières ${periodeFilter}`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Attributions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.attributions}</div>
            <p className="text-muted-foreground text-xs mt-1">matériel attribué</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Restitutions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.restitutions}</div>
            <p className="text-muted-foreground text-xs mt-1">matériel restitué</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground mr-2">Période:</span>
            {["7j", "30j", "3m", "6m", "1an", "tout"].map((p) => (
              <a
                key={p}
                href={`/historique?periode=${p}&action=${actionFilter}&page=1`}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  periodeFilter === p
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                {p === "tout" ? "Tout" : p}
              </a>
            ))}
            <span className="text-sm text-muted-foreground mx-2">|</span>
            <span className="text-sm text-muted-foreground mr-2">Action:</span>
            {["all", "Attribution", "Restitution"].map((a) => (
              <a
                key={a}
                href={`/historique?periode=${periodeFilter}&action=${a}&page=1`}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  actionFilter === a
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                {a === "all" ? "Toutes" : a}
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Liste des opérations</CardTitle>
        </CardHeader>
        <CardContent>
          <HistoriqueTable rows={rows} />
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} sur {totalPages} ({totalItems} résultats)
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <a
                    href={`/historique?periode=${periodeFilter}&action=${actionFilter}&page=${page - 1}`}
                    className="px-3 py-1.5 rounded-md text-sm bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    ← Précédent
                  </a>
                )}
                {page < totalPages && (
                  <a
                    href={`/historique?periode=${periodeFilter}&action=${actionFilter}&page=${page + 1}`}
                    className="px-3 py-1.5 rounded-md text-sm bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    Suivant →
                  </a>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
