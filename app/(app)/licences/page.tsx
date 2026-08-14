import { createSupabaseServerClient } from "@/lib/supabase/server";

import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LicencesTable } from "@/components/app/licences/licences-table";
import { LicenceFormDialog } from "@/components/app/licences/licence-form-dialog";
import { TablePagination } from "@/components/app/table-pagination";
import { Suspense } from "react";

function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(value);
}

const PAGE_SIZE = 25;

export default async function LicencesPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const pageRaw = typeof searchParams?.page === "string" ? Number.parseInt(searchParams.page, 10) : 1;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("licences")
    .select(`
      *,
      gestionnaire:employes!gestionnaire_id(prenom, nom, departement)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Licences</h1>
        <p className="text-destructive text-sm">{error.message}</p>
      </div>
    );
  }

  const licences = data ?? [];
  const paged = licences.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = {
    total: licences.length,
    actives: licences.filter((l) => l.statut === "Active" && l.is_active !== false).length,
    inactives: licences.filter((l) => l.is_active === false).length,
    expirees: licences.filter((l) => l.statut === "Expirée").length,
    postesUtilises: licences
      .filter((l) => l.is_active !== false)
      .reduce((sum, l) => sum + (l.postes_utilises ?? 0), 0),
    postesTotal: licences
      .filter((l) => l.is_active !== false)
      .reduce((sum, l) => sum + (l.nombre_postes ?? 0), 0),
    coutTotal: licences
      .filter((l) => l.statut === "Active" && l.is_active !== false)
      .reduce((sum, l) => sum + (Number(l.cout) || 0), 0),
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Licences"
        description="Gestion des licences logicielles et suivi des renouvellements."
        actions={<LicenceFormDialog />}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total licences" value={stats.total} hint="logiciels" />
        <StatCard label="Actives" value={stats.actives} hint="en cours" accent="success" />
        <StatCard label="Inactives" value={stats.inactives} hint="désactivées" accent="muted" />
        <StatCard label="Expirées" value={stats.expirees} hint="à renouveler" accent="danger" />
        <StatCard
          label="Postes utilisés"
          value={`${stats.postesUtilises}/${stats.postesTotal}`}
          hint="licences attribuées"
        />
        <StatCard
          label="Coût total"
          value={formatMoney(stats.coutTotal)}
          hint="licences actives"
          accent="muted"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Liste des licences</CardTitle>
        </CardHeader>
        <CardContent>
          <LicencesTable rows={paged} />
          <Suspense fallback={null}>
            <TablePagination page={page} pageSize={PAGE_SIZE} totalCount={licences.length} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
