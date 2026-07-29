import Link from "next/link";
import type { Tables } from "@/lib/types/database";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeFormDialog } from "@/components/app/employes/employe-form-dialog";
import { EmployesTable } from "@/components/app/employes/employes-table";
import { OnboardingDialog } from "@/components/app/attributions/onboarding-dialog";

type EmployeWithAttributions = Tables<"employes"> & {
  attributions?: { id: string; statut: string | null }[];
};

type EmployeRow = Tables<"employes"> & {
  materiel_count?: number;
  materiel_actif?: number;
};

export default async function EmployesPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createSupabaseServerClient();

  const departementFilter = typeof searchParams?.departement === "string" ? searchParams.departement : null;

  // Récupérer employés avec count de matériel attribué ET matériels disponibles
  const [employesResult, materielsResult] = await Promise.all([
    supabase
      .from("employes")
      .select(`
        *,
        attributions!employe_id (
          id,
          statut
        )
      `)
      .order("created_at", { ascending: false }),
    supabase
      .from("materiels")
      .select("id, code_materiel, type, marque, modele")
      .eq("statut", "Stock")
      .order("code_materiel"),
  ]);

  const { data, error } = employesResult;
  const materiels = materielsResult.data;

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Employés</h1>
        <p className="text-destructive text-sm">{error.message}</p>
      </div>
    );
  }

  const allEmployes = (data ?? []).map((emp: EmployeWithAttributions) => ({
    ...emp,
    materiel_count: emp.attributions?.length ?? 0,
    materiel_actif: emp.attributions?.filter((a) => a.statut === "Actif")?.length ?? 0,
  }));

  // Filtrer par département si nécessaire
  const rows = departementFilter && departementFilter !== "all"
    ? allEmployes.filter((e) => e.departement === departementFilter)
    : allEmployes;

  // Calculer stats par département
  const deptCounts = allEmployes.reduce((acc, e) => {
    const dept = e.departement || "Non renseigné";
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topDepartements = Object.entries(deptCounts)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 4);

  const stats = {
    total: allEmployes.length,
    avecMateriel: allEmployes.filter((e) => e.materiel_actif > 0).length,
    sansMateriel: allEmployes.filter((e) => e.materiel_actif === 0).length,
    totalMaterielAttribue: allEmployes.reduce((sum, e) => sum + (e.materiel_actif || 0), 0),
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Employés</h1>
          <p className="text-muted-foreground text-sm">
            Référentiel des employés et gestion du matériel attribué.
          </p>
        </div>
        <div className="flex gap-2">
          <EmployeFormDialog />
          <OnboardingDialog materiels={materiels ?? []} employes={allEmployes} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Total employés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-muted-foreground text-xs mt-1">utilisateurs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Avec matériel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.avecMateriel}</div>
            <p className="text-muted-foreground text-xs mt-1">
              {stats.total > 0 ? Math.round((stats.avecMateriel / stats.total) * 100) : 0}% des employés
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Sans matériel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.sansMateriel}</div>
            <p className="text-muted-foreground text-xs mt-1">non équipés</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Matériel attribué</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.totalMaterielAttribue}</div>
            <p className="text-muted-foreground text-xs mt-1">équipements en service</p>
          </CardContent>
        </Card>
      </div>

      {/* Top départements */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Répartition par département</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {topDepartements.map(([dept, count]) => (
              <Link
                key={dept}
                href={`/employes?departement=${encodeURIComponent(dept)}`}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  departementFilter === dept
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                {dept} <span className="ml-1 text-xs opacity-70">({String(count)})</span>
              </Link>
            ))}
            {departementFilter && departementFilter !== "all" && (
              <Link
                href="/employes"
                className="px-3 py-2 rounded-md text-sm font-medium bg-muted hover:bg-muted/80 transition-colors"
              >
                × Réinitialiser
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Liste des employés</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployesTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
