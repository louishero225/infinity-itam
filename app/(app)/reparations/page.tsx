import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReparationsTable } from "@/components/app/reparations/reparations-table";
import { ReparationFormDialog } from "@/components/app/reparations/reparation-form-dialog";

type ReparationRow = Tables<"v_reparations_details">;

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
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Réparations</h1>
          <p className="text-muted-foreground text-sm">
            Suivi des interventions et réparations sur le matériel.
          </p>
        </div>
        <ReparationFormDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total interventions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.total}</div>
            <p className="text-muted-foreground text-xs mt-1">réparations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">En cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-blue-600">{stats.enCours}</div>
            <p className="text-muted-foreground text-xs mt-1">actives</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Terminées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">{stats.terminees}</div>
            <p className="text-muted-foreground text-xs mt-1">finalisées</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Coût total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(
                stats.coutTotal
              )}{" "}
              FCFA
            </div>
            <p className="text-muted-foreground text-xs mt-1">dépenses</p>
          </CardContent>
        </Card>
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
