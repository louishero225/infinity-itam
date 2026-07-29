import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LicencesTable } from "@/components/app/licences/licences-table";
import { LicenceFormDialog } from "@/components/app/licences/licence-form-dialog";

type LicenceRow = Tables<"licences">;

export default async function LicencesPage() {
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

  const stats = {
    total: licences.length,
    actives: licences.filter((l) => l.statut === "Active" && l.is_active !== false).length,
    inactives: licences.filter((l) => l.is_active === false).length,
    expirees: licences.filter((l) => l.statut === "Expirée").length,
    postesUtilises: licences.filter((l) => l.is_active !== false).reduce((sum, l) => sum + (l.postes_utilises ?? 0), 0),
    postesTotal: licences.filter((l) => l.is_active !== false).reduce((sum, l) => sum + (l.nombre_postes ?? 0), 0),
    coutTotal: licences
      .filter((l) => l.statut === "Active" && l.is_active !== false)
      .reduce((sum, l) => sum + (Number(l.cout) || 0), 0),
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Licences</h1>
          <p className="text-muted-foreground text-sm">
            Gestion des licences logicielles et alertes de renouvellement.
          </p>
        </div>
        <LicenceFormDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total licences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.total}</div>
            <p className="text-muted-foreground text-xs mt-1">logiciels</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Actives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">{stats.actives}</div>
            <p className="text-muted-foreground text-xs mt-1">en cours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Inactives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-600">{stats.inactives}</div>
            <p className="text-muted-foreground text-xs mt-1">désactivées</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Expirées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">{stats.expirees}</div>
            <p className="text-muted-foreground text-xs mt-1">à renouveler</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Postes utilisés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {stats.postesUtilises}/{stats.postesTotal}
            </div>
            <p className="text-muted-foreground text-xs mt-1">licences attribuées</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Coût total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-blue-600">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(stats.coutTotal)}
            </div>
            <p className="text-muted-foreground text-xs mt-1">licences actives</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Liste des licences</CardTitle>
        </CardHeader>
        <CardContent>
          <LicencesTable rows={licences} />
        </CardContent>
      </Card>
    </div>
  );
}
