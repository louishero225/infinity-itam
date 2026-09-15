import Link from "next/link";
import type { Tables } from "@/lib/types/database";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeFormDialog } from "@/components/app/employes/employe-form-dialog";
import { EmployesTable } from "@/components/app/employes/employes-table";
import { OnboardingDialog } from "@/components/app/attributions/onboarding-dialog";
import { TablePagination } from "@/components/app/table-pagination";
import { Suspense } from "react";

type EmployeRow = Tables<"employes"> & {
  materiel_count: number;
  materiel_actif: number;
};

const PAGE_SIZE = 25;

function parsePage(value: string | string[] | undefined) {
  const raw = typeof value === "string" ? Number.parseInt(value, 10) : 1;
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
}

export default async function EmployesPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createSupabaseServerClient();

  const departementFilter =
    typeof searchParams?.departement === "string" ? searchParams.departement : null;
  const page = parsePage(searchParams?.page);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let listQuery = supabase
    .from("employes")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (departementFilter && departementFilter !== "all") {
    listQuery = listQuery.eq("departement", departementFilter);
  }

  const [
    { data: pageEmployes, error, count: filteredCount },
    { data: deptRows },
    { data: actifs },
    { data: materiels },
    { data: employesOptions },
  ] = await Promise.all([
    listQuery.range(from, to),
    supabase.from("employes").select("departement"),
    supabase.from("attributions").select("employe_id").eq("statut", "Actif").not("employe_id", "is", null),
    supabase
      .from("materiels")
      .select("id, code_materiel, type, marque, modele")
      .eq("statut", "Stock")
      .order("code_materiel"),
    supabase.from("employes").select("id, prenom, nom, departement").order("prenom"),
  ]);

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Employés</h1>
        <p className="text-destructive text-sm">{error.message}</p>
      </div>
    );
  }

  const actifsByEmploye = new Map<string, number>();
  for (const row of actifs ?? []) {
    if (!row.employe_id) continue;
    actifsByEmploye.set(row.employe_id, (actifsByEmploye.get(row.employe_id) ?? 0) + 1);
  }

  const pagedRows: EmployeRow[] = (pageEmployes ?? []).map((emp) => {
    const actif = actifsByEmploye.get(emp.id) ?? 0;
    return {
      ...emp,
      materiel_count: actif,
      materiel_actif: actif,
    };
  });

  const allDept = deptRows ?? [];
  const deptCounts = allDept.reduce(
    (acc, e) => {
      const dept = e.departement || "Non renseigné";
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const topDepartements = Object.entries(deptCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const avecMateriel = [...actifsByEmploye.keys()].length;
  const total = allDept.length;
  const stats = {
    total,
    avecMateriel,
    sansMateriel: Math.max(0, total - avecMateriel),
    totalMaterielAttribue: [...actifsByEmploye.values()].reduce((s, n) => s + n, 0),
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Employés"
        description="Référentiel des employés et gestion du matériel attribué."
        actions={
          <>
            <EmployeFormDialog />
            <OnboardingDialog materiels={materiels ?? []} employes={employesOptions ?? []} />
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total employés" value={stats.total} hint="utilisateurs" />
        <StatCard
          label="Avec matériel"
          value={stats.avecMateriel}
          hint={`${stats.total > 0 ? Math.round((stats.avecMateriel / stats.total) * 100) : 0} % des employés`}
          accent="success"
        />
        <StatCard
          label="Sans matériel"
          value={stats.sansMateriel}
          hint="non équipés"
          accent="warning"
        />
        <StatCard
          label="Matériel attribué"
          value={stats.totalMaterielAttribue}
          hint="équipements en service"
        />
      </div>

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
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  departementFilter === dept
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                {dept} <span className="ml-1 text-xs opacity-70">({String(count)})</span>
              </Link>
            ))}
            {departementFilter && departementFilter !== "all" ? (
              <Link
                href="/employes"
                className="rounded-md bg-muted px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-muted/80"
              >
                Réinitialiser
              </Link>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Liste des employés</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployesTable rows={pagedRows} />
          <Suspense fallback={null}>
            <TablePagination
              page={page}
              pageSize={PAGE_SIZE}
              totalCount={filteredCount ?? pagedRows.length}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
