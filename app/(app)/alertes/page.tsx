import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const { data: licencesData } = await supabase
    .from("v_licences_alertes")
    .select("*")
    .order("jours_avant_expiration", { ascending: true });

  const { data: paiementsData } = await supabase
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
      <PageHeader
        title="Alertes"
        description="Maintenance, garanties, renouvellements de licences et paiements à traiter."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total actives" value={stats.total} hint="alertes matériel" />
        <StatCard label="Critiques" value={stats.critique} hint="priorité haute" accent="danger" />
        <StatCard label="Échues" value={stats.echue} hint="en retard" accent="warning" />
        <StatCard label="Urgentes" value={stats.urgente} hint="à traiter rapidement" accent="warning" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Alertes matériel</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertesTable rows={filtered} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Alertes licences — renouvellements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-4 md:grid-cols-4">
            <StatCard label="Total" value={licencesStats.total} />
            <StatCard label="Expirées" value={licencesStats.expirees} accent="danger" />
            <StatCard label="Critiques (<7 j)" value={licencesStats.critiques} accent="warning" />
            <StatCard label="Urgentes (<30 j)" value={licencesStats.urgentes} accent="warning" />
          </div>
          <LicencesAlertesTable rows={licencesAlertes} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Alertes paiements — à régler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-4 md:grid-cols-4">
            <StatCard label="Total" value={paiementsStats.total} />
            <StatCard label="Très en retard (>7 j)" value={paiementsStats.tresEnRetard} accent="danger" />
            <StatCard label="En retard" value={paiementsStats.enRetard} accent="warning" />
            <StatCard label="À payer bientôt (<7 j)" value={paiementsStats.aPayerBientot} accent="warning" />
          </div>
          <PaiementsAlertesTable rows={paiementsAlertes} />
        </CardContent>
      </Card>
    </div>
  );
}
