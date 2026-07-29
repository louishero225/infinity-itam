import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AchatsTable } from "@/components/app/achats/achats-table";
import { DemandeAchatFormDialog } from "@/components/app/achats/demande-achat-form-dialog";

type DemandeAchatRow = Tables<"v_demandes_achat_details">;

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
    enProduction: demandes.filter((d) => d.statut === "En production").length,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Achats & Décaissements</h1>
          <p className="text-muted-foreground text-sm">
            Gestion des demandes d'achat avec workflow complet: devis → décaissement → réception
            → mise en production.
          </p>
        </div>
        <DemandeAchatFormDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total demandes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.total}</div>
            <p className="text-muted-foreground text-xs mt-1">toutes périodes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-yellow-600">{stats.enAttente}</div>
            <p className="text-muted-foreground text-xs mt-1">à approuver</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">En cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-blue-600">
              {stats.approuvees + stats.decaissees + stats.receptionnees}
            </div>
            <p className="text-muted-foreground text-xs mt-1">approuvées/décaissées/livrées</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Montant total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(
                stats.montantTotal
              )}{" "}
              FCFA
            </div>
            <p className="text-muted-foreground text-xs mt-1">budget investi</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Liste des demandes d'achat</CardTitle>
        </CardHeader>
        <CardContent>
          <AchatsTable rows={demandes} />
        </CardContent>
      </Card>
    </div>
  );
}
