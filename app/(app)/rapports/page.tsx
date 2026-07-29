import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  FileText, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Package, 
  AlertCircle,
  Download
} from "lucide-react";
import { ExportButtons } from "@/components/app/rapports/export-buttons";
import { TcoDepartementChart } from "@/components/app/rapports/tco-departement-chart";
import { TimelineAttributionsChart } from "@/components/app/rapports/timeline-attributions-chart";
import { LicencesUtilisationChart } from "@/components/app/rapports/licences-utilisation-chart";
import Link from "next/link";

export default async function RapportsPage() {
  const supabase = await createSupabaseServerClient();

  // Récupérer stats pour les rapports
  const [{ data: synthese }, { data: materiels }, { data: employes }, { data: licences }, { data: reparations }, { data: achats }] =
    await Promise.all([
      supabase.from("v_direction_synthese").select("*").maybeSingle(),
      supabase.from("materiels").select("type, statut, cout, date_achat"),
      supabase.from("employes").select("id, departement"),
      supabase.from("licences").select("cout, statut"),
      supabase.from("v_reparations_details").select("cout, statut"),
      supabase.from("demandes_achat").select("montant_total, statut"),
    ]);

  // Calculs analytiques
  const totalMateriel = materiels?.length ?? 0;
  const totalEmployes = employes?.length ?? 0;
  const coutTotalParc = synthese?.cout_total_parc ?? 0;
  const coutLicences = licences?.reduce((sum, l) => sum + (l.cout ?? 0), 0) ?? 0;
  const coutReparations = reparations?.reduce((sum, r) => sum + (r.cout ?? 0), 0) ?? 0;
  const coutAchats = achats?.reduce((sum, a) => sum + (a.montant_total ?? 0), 0) ?? 0;
  const coutTotalAnnuel = coutLicences + coutReparations + coutAchats;

  // TCO moyen par employé
  const tcoParEmploye = totalEmployes > 0 ? Math.round((coutTotalParc + coutTotalAnnuel) / totalEmployes) : 0;

  // Taux utilisation licences
  const licencesActives = licences?.filter((l) => l.statut === "Active").length ?? 0;
  const tauxUtilisationLicences = licences && licences.length > 0 ? Math.round((licencesActives / licences.length) * 100) : 0;

  // Données pour charts avancés
  
  // 1. TCO par département
  const { data: attributionsParDept } = await supabase
    .from("attributions")
    .select(`
      employe:employes!employe_id (departement),
      materiel:materiels!materiel_id (cout)
    `)
    .eq("statut", "Actif");

  const { data: licencesData } = await supabase
    .from("licences")
    .select("nom, nombre_total, nombre_utilise, cout, statut");

  const tcoDepartements = new Map<string, { cout_materiel: number; cout_licences: number; cout_reparations: number }>();
  
  (attributionsParDept || []).forEach((attr: any) => {
    const dept = attr.employe?.departement || "Non renseigné";
    const current = tcoDepartements.get(dept) || { cout_materiel: 0, cout_licences: 0, cout_reparations: 0 };
    current.cout_materiel += attr.materiel?.cout || 0;
    tcoDepartements.set(dept, current);
  });

  // Répartir licences et réparations proportionnellement (simplifié)
  const totalDepts = tcoDepartements.size;
  if (totalDepts > 0) {
    const licencesParDept = coutLicences / totalDepts;
    const reparationsParDept = coutReparations / totalDepts;
    tcoDepartements.forEach((value) => {
      value.cout_licences = licencesParDept;
      value.cout_reparations = reparationsParDept;
    });
  }

  const tcoChartData = Array.from(tcoDepartements.entries())
    .map(([departement, couts]) => ({
      departement,
      ...couts,
      total: couts.cout_materiel + couts.cout_licences + couts.cout_reparations,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  // 2. Timeline attributions (12 derniers mois)
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const { data: historiqueData } = await supabase
    .from("v_historique_attributions")
    .select("action, date_action")
    .gte("date_action", twelveMonthsAgo.toISOString());

  const timelineByMonth = new Map<string, { attributions: number; restitutions: number }>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    timelineByMonth.set(key, { attributions: 0, restitutions: 0 });
  }

  (historiqueData || []).forEach((h: any) => {
    const date = new Date(h.date_action);
    const key = date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    const current = timelineByMonth.get(key);
    if (current) {
      if (h.action === "Attribution") current.attributions++;
      if (h.action === "Restitution") current.restitutions++;
    }
  });

  let actifCumul = 0;
  const timelineChartData = Array.from(timelineByMonth.entries()).map(([mois, data]) => {
    actifCumul += data.attributions - data.restitutions;
    return {
      mois,
      ...data,
      actif: actifCumul,
    };
  });

  // 3. Utilisation licences
  const licencesUtilisationData = (licencesData || [])
    .filter((l: any) => l.nombre_total > 0)
    .map((l: any) => ({
      nom: l.nom,
      utilisees: l.nombre_utilise || 0,
      disponibles: l.nombre_total - (l.nombre_utilise || 0),
      taux: l.nombre_total > 0 ? Math.round((l.nombre_utilise / l.nombre_total) * 100) : 0,
    }))
    .slice(0, 8);

  // Rapports prédéfinis
  const rapportsPredéfinis = [
    {
      titre: "Rapport Inventaire",
      description: "Parc complet avec détails matériel, statuts, et affectations",
      icon: Package,
      stats: `${totalMateriel} équipements`,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      href: "/materiels",
    },
    {
      titre: "Rapport Financier",
      description: "Coûts totaux: parc, licences, réparations, et achats",
      icon: DollarSign,
      stats: `${new Intl.NumberFormat("fr-FR").format(coutTotalParc + coutTotalAnnuel)} FCFA`,
      color: "text-green-600",
      bgColor: "bg-green-50",
      href: "/achats",
    },
    {
      titre: "Rapport RH",
      description: "Employés et matériel attribué par département",
      icon: Users,
      stats: `${totalEmployes} employés`,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      href: "/employes",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Rapports & Analytics</h1>
        <p className="text-muted-foreground text-sm">
          Rapports prédéfinis, statistiques avancées, et exports de données.
        </p>
      </div>

      {/* KPI Analytics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">TCO par employé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("fr-FR").format(tcoParEmploye)} FCFA
            </div>
            <p className="text-muted-foreground text-xs mt-1">coût moyen total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Coût licences/an</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {new Intl.NumberFormat("fr-FR").format(coutLicences)} FCFA
            </div>
            <p className="text-muted-foreground text-xs mt-1">abonnements logiciels</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Coût réparations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {new Intl.NumberFormat("fr-FR").format(coutReparations)} FCFA
            </div>
            <p className="text-muted-foreground text-xs mt-1">maintenance cumulée</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Taux licences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{tauxUtilisationLicences}%</div>
            <p className="text-muted-foreground text-xs mt-1">licences actives</p>
          </CardContent>
        </Card>
      </div>

      {/* Rapports prédéfinis */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Rapports prédéfinis</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {rapportsPredéfinis.map((rapport) => {
            const Icon = rapport.icon;
            return (
              <Link key={rapport.titre} href={rapport.href}>
                <Card className="hover:border-primary transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg ${rapport.bgColor}`}>
                        <Icon className={`h-6 w-6 ${rapport.color}`} />
                      </div>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-base mt-3">{rapport.titre}</CardTitle>
                    <CardDescription className="text-xs">{rapport.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${rapport.color}`}>
                        {rapport.stats}
                      </span>
                      <span className="text-xs text-muted-foreground">Accéder →</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Graphiques avancés */}
      <div className="grid gap-4 md:grid-cols-2">
        <TcoDepartementChart data={tcoChartData} />
        <TimelineAttributionsChart data={timelineChartData} />
      </div>

      <LicencesUtilisationChart data={licencesUtilisationData} />

      {/* Analytics avancées */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Analytics avancées</CardTitle>
          <CardDescription>Statistiques et indicateurs de performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-sm text-muted-foreground">Coût total parc</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat("fr-FR").format(coutTotalParc)} FCFA
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-sm text-muted-foreground">Coûts annuels (licences + réparations)</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat("fr-FR").format(coutTotalAnnuel)} FCFA
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-sm text-muted-foreground">Investissements achats</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat("fr-FR").format(coutAchats)} FCFA
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">TCO total (parc + annuel)</span>
                <span className="font-bold text-lg">
                  {new Intl.NumberFormat("fr-FR").format(coutTotalParc + coutTotalAnnuel)} FCFA
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-sm text-muted-foreground">Ratio équipement/employé</span>
                <span className="font-semibold">
                  {totalEmployes > 0 ? (totalMateriel / totalEmployes).toFixed(2) : "0"}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-sm text-muted-foreground">Matériel en stock</span>
                <span className="font-semibold">
                  {materiels?.filter((m) => m.statut === "Stock").length ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-sm text-muted-foreground">Matériel en maintenance</span>
                <span className="font-semibold">
                  {materiels?.filter((m) => m.statut === "Maintenance").length ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Réparations en cours</span>
                <span className="font-semibold">
                  {reparations?.filter((r) => r.statut === "En cours").length ?? 0}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exports de données</CardTitle>
          <CardDescription>Télécharger les données au format Excel</CardDescription>
        </CardHeader>
        <CardContent>
          <ExportButtons />
        </CardContent>
      </Card>
    </div>
  );
}
