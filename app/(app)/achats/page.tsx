import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AchatsTable } from "@/components/app/achats/achats-table";
import { DemandeAchatFormDialog } from "@/components/app/achats/demande-achat-form-dialog";

type DemandeAchatRow = Tables<"v_demandes_achat_details">;

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)} FCFA`;
}

export default async function AchatsPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("v_demandes_achat_details")
    .select("*")
    .returns<DemandeAchatRow[]>();

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Achats & Décaissements</h1>
        <p className="text-destructive text-sm">{error.message}</p>
      </div>
    );
  }

  const demandes = data ?? [];

  const stats = {
    total: demandes.length,
    enAttente: demandes.filter((d) => d.statut === "En attente").length,
    approuvees: demandes.filter((d) => d.statut === "Approuvée").length,
    decaissees: demandes.filter((d) => d.statut === "Décaissée").length,
    receptionnees: demandes.filter((d) => d.statut === "Réceptionnée").length,
    montantTotal: demandes.reduce((sum, d) => sum + (d.montant_total ?? 0), 0),
  };

  const enCours = stats.approuvees + stats.decaissees + stats.receptionnees;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Achats & Décaissements"
        description="Gestion des demandes d'achat : devis, décaissement, réception et mise en production."
        actions={<DemandeAchatFormDialog />}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total demandes" value={stats.total} hint="toutes périodes" />
        <StatCard
          label="En attente"
          value={stats.enAttente}
          hint="à approuver"
          accent="warning"
        />
        <StatCard
          label="En cours"
          value={enCours}
          hint="approuvées / décaissées / livrées"
        />
        <StatCard
          label="Montant total"
          value={formatMoney(stats.montantTotal)}
          hint="budget investi"
          accent="muted"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Liste des demandes d&apos;achat</CardTitle>
        </CardHeader>
        <CardContent>
          <AchatsTable rows={demandes} />
        </CardContent>
      </Card>
    </div>
  );
}
