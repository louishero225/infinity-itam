import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AttributionFormDialog } from "@/components/app/attributions/attribution-form-dialog";
import { AttributionsTable } from "@/components/app/attributions/attributions-table";
import { AttributionsStats } from "@/components/app/attributions/attributions-stats";
import { AttributionsFilters } from "@/components/app/attributions/attributions-filters";
import { OnboardingDialog } from "@/components/app/attributions/onboarding-dialog";

type AttributionRow = {
  id: string;
  date_attribution: string;
  statut: string | null;
  beneficiaire_type: string | null;
  beneficiaire_label: string | null;
  materiel: { id: string; code_materiel: string; type: string } | null;
  employe: { id: string; prenom: string; nom: string; departement: string } | null;
};

type MaterielOption = {
  id: string;
  code_materiel: string;
  type: string;
  marque: string | null;
  modele: string | null;
};

type EmployeOption = { id: string; prenom: string; nom: string; departement: string };

export default async function AttributionsPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createSupabaseServerClient();

  const [{ data: attributions, error: attrError }, { data: materiels }, { data: employes }] =
    await Promise.all([
      supabase
        .from("attributions")
        .select(
          `id, date_attribution, statut,
           beneficiaire_type, beneficiaire_label,
           materiel:materiel_id (id, code_materiel, type),
           employe:employe_id (id, prenom, nom, departement)`
        )
        .eq("statut", "Actif")
        .order("date_attribution", { ascending: false })
        .returns<AttributionRow[]>(),
      supabase
        .from("materiels")
        .select("id, code_materiel, type, marque, modele")
        .eq("statut", "Stock")
        .order("code_materiel")
        .returns<MaterielOption[]>(),
      supabase
        .from("employes")
        .select("id, prenom, nom, departement")
        .order("prenom")
        .returns<EmployeOption[]>(),
    ]);

  if (attrError) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Attributions</h1>
        <p className="text-destructive text-sm">{attrError.message}</p>
      </div>
    );
  }

  const allRows = attributions ?? [];
  
  const departementFilter = typeof searchParams?.departement === "string" ? searchParams.departement : null;
  const typeFilter = typeof searchParams?.type === "string" ? searchParams.type : null;

  // Filtrer les attributions
  const rows = allRows.filter((attr) => {
    if (departementFilter && attr.employe?.departement !== departementFilter) return false;
    if (typeFilter && attr.materiel?.type !== typeFilter) return false;
    return true;
  });

  // Calculer stats
  const stats = {
    total: rows.length,
    parEmploye: rows.filter((a) => a.beneficiaire_type === "employe").length,
    parDepartement: rows.filter((a) => a.beneficiaire_type === "departement").length,
    parSociete: rows.filter((a) => a.beneficiaire_type === "societe").length,
  };

  // Calculer durée moyenne en jours
  const dureesMoyenne = rows
    .map((a) => {
      const dateAttr = new Date(a.date_attribution);
      const now = new Date();
      return (now.getTime() - dateAttr.getTime()) / (1000 * 60 * 60 * 24);
    })
    .filter((d) => d > 0);
  
  const dureeeMoyenne = dureesMoyenne.length > 0
    ? dureesMoyenne.reduce((sum, d) => sum + d, 0) / dureesMoyenne.length
    : undefined;

  // Extraire départements uniques et types uniques
  const departementsUniques = Array.from(
    new Set(
      allRows
        .map((a) => a.employe?.departement)
        .filter(Boolean)
    )
  ).sort() as string[];

  const typesUniques = Array.from(
    new Set(
      allRows
        .map((a) => a.materiel?.type)
        .filter(Boolean)
    )
  ).sort() as string[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Attributions</h1>
          <p className="text-muted-foreground text-sm">
            Attribuer et restituer le matériel.
          </p>
        </div>

        <div className="flex gap-2">
          <AttributionFormDialog materiels={materiels ?? []} employes={employes ?? []} />
          <OnboardingDialog materiels={materiels ?? []} employes={employes ?? []} />
        </div>
      </div>

      <AttributionsStats
        total={stats.total}
        parEmploye={stats.parEmploye}
        parDepartement={stats.parDepartement}
        parSociete={stats.parSociete}
        dureeeMoyenne={dureeeMoyenne}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <AttributionsFilters
            departements={departementsUniques}
            types={typesUniques}
          />
        </CardContent>
      </Card>

      <AttributionsTable rows={rows} />
    </div>
  );
}
