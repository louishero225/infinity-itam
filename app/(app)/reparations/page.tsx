import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReparationsTable } from "@/components/app/reparations/reparations-table";
import { ReparationFormDialog } from "@/components/app/reparations/reparation-form-dialog";

type ReparationRow = Tables<"v_reparations_details">;

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)} FCFA`;
}

export default async function ReparationsPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("v_reparations_details")
    .select("*")
    .returns<ReparationRow[]>();

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Réparations</h1>
        <p className="text-destructive text-sm">{error.message}</p>
      </div>
    );
  }

  const reparations = data ?? [];

  const stats = {
    total: reparations.length,
    enCours: reparations.filter((r) => r.statut === "En cours").length,
    terminees: reparations.filter((r) => r.statut === "Terminée").length,
    coutTotal: reparations.reduce((sum, r) => sum + (r.cout ?? 0), 0),
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Réparations"
        description="Suivi des interventions et réparations sur le matériel."
        actions={<ReparationFormDialog />}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total interventions" value={stats.total} hint="réparations" />
        <StatCard label="En cours" value={stats.enCours} hint="actives" accent="warning" />
        <StatCard label="Terminées" value={stats.terminees} hint="finalisées" accent="success" />
        <StatCard
          label="Coût total"
          value={formatMoney(stats.coutTotal)}
          hint="dépenses cumulées"
          accent="muted"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Historique des interventions</CardTitle>
        </CardHeader>
        <CardContent>
          <ReparationsTable rows={reparations} />
        </CardContent>
      </Card>
    </div>
  );
}
