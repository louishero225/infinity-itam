import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertesTable } from "@/components/app/alertes/alertes-table";
import { LicencesAlertesTable } from "@/components/app/alertes/licences-alertes-table";
import { PaiementsAlertesTable } from "@/components/app/alertes/paiements-alertes-table";

type AlerteRow = Tables<"v_alertes_actives">;

export default async function AlertesPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createSupabaseServerClient();

  const typeFilter = typeof searchParams?.type === "string" ? searchParams.type : null;
  const prioriteFilter = typeof searchParams?.priorite === "string" ? searchParams.priorite : null;

  const { data, error } = await supabase
    .from("v_alertes_actives")
    .select("*")
    .returns<AlerteRow[]>();

  const { data: licencesData, error: licencesError } = await supabase
    .from("v_licences_alertes")
    .select("*")
    .order("jours_avant_expiration", { ascending: true });

  const { data: paiementsData, error: paiementsError } = await supabase
    .from("v_licences_paiements_alertes")
    .select("*")
    .order("date_paiement_prevue", { ascending: true });

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Alertes</h1>
        <p className="text-destructive text-sm">{error.message}</p>
      </div>
    );
  }

  const allAlertes = data ?? [];

  const filtered = allAlertes.filter((a) => {
    if (typeFilter && typeFilter !== "all" && a.type !== typeFilter) return false;
    if (prioriteFilter && prioriteFilter !== "all" && a.priorite !== prioriteFilter) return false;
    return true;
  });

  const licencesAlertes = licencesData ?? [];
  const paiementsAlertes = paiementsData ?? [];

  const stats = {
    total: filtered.length,
    critique: filtered.filter((a) => a.priorite === "critique").length,
    echue: filtered.filter((a) => a.urgence === "Échue").length,
    urgente: filtered.filter((a) => a.urgence === "Urgente").length,
  };

  const licencesStats = {
    total: licencesAlertes.length,
    expirees: licencesAlertes.filter((l) => l.niveau_urgence === "Expirée").length,
    critiques: licencesAlertes.filter((l) => l.niveau_urgence === "Critique").length,
    urgentes: licencesAlertes.filter((l) => l.niveau_urgence === "Urgent").length,
  };

  const paiementsStats = {
    total: paiementsAlertes.length,
    tresEnRetard: paiementsAlertes.filter((p) => p.niveau_urgence_paiement === "Très en retard").length,
    enRetard: paiementsAlertes.filter((p) => p.niveau_urgence_paiement === "En retard").length,
    aPayerBientot: paiementsAlertes.filter((p) => p.niveau_urgence_paiement === "À payer bientôt").length,
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Alertes</h1>
        <p className="text-muted-foreground text-sm">
          Gestion des alertes de maintenance, garanties et renouvellements.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total actives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.total}</div>
            <p className="text-muted-foreground text-xs mt-1">alertes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Critiques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">{stats.critique}</div>
            <p className="text-muted-foreground text-xs mt-1">priorité haute</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Échues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-orange-600">{stats.echue}</div>
            <p className="text-muted-foreground text-xs mt-1">en retard</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Urgentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-yellow-600">{stats.urgente}</div>
            <p className="text-muted-foreground text-xs mt-1">à traiter rapidement</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Alertes Matériel</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertesTable rows={filtered} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Alertes Licences - Renouvellements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold">{licencesStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">Expirées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold text-red-600">{licencesStats.expirees}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">Critiques (&lt;7j)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold text-orange-600">{licencesStats.critiques}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">Urgentes (&lt;30j)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold text-yellow-600">{licencesStats.urgentes}</div>
              </CardContent>
            </Card>
          </div>
          <LicencesAlertesTable rows={licencesAlertes} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Alertes Paiements - À régler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold">{paiementsStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">Très en retard (&gt;7j)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold text-red-600">{paiementsStats.tresEnRetard}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">En retard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold text-orange-600">{paiementsStats.enRetard}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">À payer bientôt (&lt;7j)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold text-yellow-600">{paiementsStats.aPayerBientot}</div>
              </CardContent>
            </Card>
          </div>
          <PaiementsAlertesTable rows={paiementsAlertes} />
        </CardContent>
      </Card>
    </div>
  );
}
