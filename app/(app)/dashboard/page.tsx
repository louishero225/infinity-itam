import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DepartmentStats } from "@/components/app/dashboard/department-stats";
import { CategoryStats } from "@/components/app/dashboard/category-stats";
import { DernieresAcquisitions } from "@/components/app/dashboard/dernieres-acquisitions";
import { AcquisitionsChart } from "@/components/app/dashboard/acquisitions-chart";
import { CategoriesChart } from "@/components/app/dashboard/categories-chart";
import { StatutsChart } from "@/components/app/dashboard/statuts-chart";
import { CoutsChart } from "@/components/app/dashboard/couts-chart";

type SyntheseRow = Tables<"v_direction_synthese">;
type ParDeptRow = Tables<"v_direction_par_departement">;

type MaterielMini = {
  type: string;
  statut: string | null;
  etat: string | null;
  site: string | null;
};

function formatMoney(value: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  // Récupérer les 3 dernières acquisitions (avec ou sans affectation)
  const { data: dernieresAcquisitions } = await supabase
    .from("materiels")
    .select(`
      id,
      code_materiel,
      type,
      date_achat,
      cout,
      statut,
      attributions (
        statut,
        employe:employes (
          nom,
          prenom
        )
      ),
      demandes_achat!materiel_id (
        numero_demande
      )
    `)
    .not("date_achat", "is", null)
    .order("date_achat", { ascending: false })
    .limit(3);

  const acquisitionsFormatees = (dernieresAcquisitions ?? []).map((m) => {
    const attributions = m.attributions as unknown as
      | { statut: string | null; employe: { nom: string; prenom: string } | null }[]
      | undefined;
    const attributionActive = attributions?.find((a) => a.statut === "Actif");
    const employeRaw = attributionActive?.employe;
    const employe = Array.isArray(employeRaw) ? employeRaw[0] : employeRaw;

    return {
      id: m.id as string,
      code_materiel: m.code_materiel as string,
      type: m.type as string,
      date_achat: m.date_achat as string | null,
      cout: m.cout as number | null,
      statut: m.statut as string | null,
      numero_demande:
        (m.demandes_achat as { numero_demande: string | null }[] | undefined)?.[0]
          ?.numero_demande ?? null,
      employe_nom: employe?.nom ?? null,
      employe_prenom: employe?.prenom ?? null,
    };
  });

  const [{ data: synthese }, { data: parDept }, { data: materielsMini }] =
    await Promise.all([
    supabase.from("v_direction_synthese").select("*").maybeSingle<SyntheseRow>(),
    supabase
      .from("v_direction_par_departement")
      .select("*")
      .order("nombre_materiels", { ascending: false })
      .limit(6)
      .returns<ParDeptRow[]>(),
    supabase
      .from("materiels")
      .select("type, statut, etat, site")
      .returns<MaterielMini[]>(),
  ]);

  const kpiTotal = synthese?.total_materiels ?? null;
  const kpiStock = synthese?.materiels_en_stock ?? null;
  const kpiAttribues = synthese?.materiels_attribues ?? null;
  const kpiValeur = synthese?.cout_total_parc ?? null;

  const materiels = materielsMini ?? [];

  const countsByType = new Map<string, number>();
  for (const m of materiels) {
    const t = (m.type ?? "").trim() || "Non renseigné";
    countsByType.set(t, (countsByType.get(t) ?? 0) + 1);
  }

  const parType = Array.from(countsByType.entries())
    .map(([type, nombre_materiels]) => ({ type, nombre_materiels }))
    .sort((a, b) => b.nombre_materiels - a.nombre_materiels);

  // Préparer données pour charts
  // 1. Évolution acquisitions (6 derniers mois)
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  
  const { data: acquisitionsData } = await supabase
    .from("materiels")
    .select("date_achat, cout")
    .not("date_achat", "is", null)
    .gte("date_achat", sixMonthsAgo.toISOString());

  const acquisitionsByMonth = new Map<string, { count: number; valeur: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    acquisitionsByMonth.set(key, { count: 0, valeur: 0 });
  }

  (acquisitionsData || []).forEach((m: { date_achat: string; cout: number | null }) => {
    const date = new Date(m.date_achat);
    const key = date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    const current = acquisitionsByMonth.get(key);
    if (current) {
      current.count++;
      current.valeur += m.cout || 0;
    }
  });

  const acquisitionsChartData = Array.from(acquisitionsByMonth.entries()).map(
    ([mois, data]) => ({ mois, ...data })
  );

  // 2. Distribution par catégorie (pour bar chart)
  const categoriesChartData = Array.from(countsByType.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // 3. Répartition par statut (pour pie chart)
  const statutCounts = new Map<string, number>();
  materiels.forEach((m) => {
    const statut = m.statut || "Stock";
    statutCounts.set(statut, (statutCounts.get(statut) || 0) + 1);
  });

  const total = materiels.length;
  const statutsChartData = Array.from(statutCounts.entries()).map(([statut, count]) => ({
    statut,
    count,
    percentage: total > 0 ? (count / total) * 100 : 0,
  }));

  // 4. Coûts mensuels (achats + réparations)
  const { data: reparationsData } = await supabase
    .from("reparations")
    .select("date_intervention, cout")
    .not("date_intervention", "is", null)
    .gte("date_intervention", sixMonthsAgo.toISOString());

  const coutsByMonth = new Map<string, { achats: number; reparations: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    coutsByMonth.set(key, { achats: 0, reparations: 0 });
  }

  (acquisitionsData || []).forEach((m: { date_achat: string; cout: number | null }) => {
    const date = new Date(m.date_achat);
    const key = date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    const current = coutsByMonth.get(key);
    if (current) {
      current.achats += m.cout || 0;
    }
  });

  (reparationsData || []).forEach((r: { date_intervention: string; cout: number | null }) => {
    const date = new Date(r.date_intervention);
    const key = date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    const current = coutsByMonth.get(key);
    if (current) {
      current.reparations += r.cout || 0;
    }
  });

  const coutsChartData = Array.from(coutsByMonth.entries()).map(([mois, data]) => ({
    mois,
    ...data,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard ITAM</h1>
          <p className="text-muted-foreground text-sm">Vue d'ensemble et analytics du parc informatique</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Link href="/materiels" className="transition-transform hover:scale-[1.02]">
          <Card className="cursor-pointer hover:border-primary hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">Total matériel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpiTotal ?? "—"}</div>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">En stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{kpiStock ?? "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Attribués</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{kpiAttribues ?? "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Valeur totale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-purple-600">{formatMoney(kpiValeur)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques principaux - 2 colonnes */}
      <div className="grid grid-cols-2 gap-4">
        <AcquisitionsChart data={acquisitionsChartData} />
        <CoutsChart data={coutsChartData} />
      </div>

      {/* Graphiques secondaires - 3 colonnes */}
      <div className="grid grid-cols-3 gap-4">
        <CategoriesChart data={categoriesChartData} />
        <StatutsChart data={statutsChartData} />
        <DernieresAcquisitions rows={acquisitionsFormatees} />
      </div>

      {/* Stats détaillées - 2 colonnes */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Équipements par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryStats data={parType} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Matériel par département</CardTitle>
          </CardHeader>
          <CardContent>
            <DepartmentStats data={parDept ?? []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
