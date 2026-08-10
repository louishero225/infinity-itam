import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { PageHeader } from "@/components/app/page-header";
import { getEntites } from "@/app/(app)/entites/actions";
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
  entite: { id: string; code: string; nom: string; type: "departement" | "societe" | "site" } | null;
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

  const [{ data: attributions, error: attrError }, { data: materiels }, { data: employes }, entites] =
    await Promise.all([
      supabase
        .from("attributions")
        .select(
          `id, date_attribution, statut,
           beneficiaire_type, beneficiaire_label,
           materiel:materiel_id (id, code_materiel, type),
           employe:employe_id (id, prenom, nom, departement),
           entite:entite_id (id, code, nom, type)`
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
      getEntites(),
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
  const destinataireFilter =
    typeof searchParams?.destinataire === "string" ? searchParams.destinataire : null;

  const rows = allRows.filter((attr) => {
    if (destinataireFilter === "employe" && attr.beneficiaire_type !== "employe") return false;
    if (
      destinataireFilter === "entite" &&
      attr.beneficiaire_type !== "departement" &&
      attr.beneficiaire_type !== "societe" &&
      attr.beneficiaire_type !== "site"
    ) {
      return false;
    }
    if (departementFilter && attr.employe?.departement !== departementFilter) return false;
    if (typeFilter && attr.materiel?.type !== typeFilter) return false;
    return true;
  });

  const stats = {
    total: rows.length,
    parEmploye: rows.filter((a) => a.beneficiaire_type === "employe").length,
    parDepartement: rows.filter((a) => a.beneficiaire_type === "departement").length,
    parSociete: rows.filter((a) => a.beneficiaire_type === "societe").length,
  };

  const dureesMoyenne = rows
    .map((a) => {
      const dateAttr = new Date(a.date_attribution);
      const now = new Date();
      return (now.getTime() - dateAttr.getTime()) / (1000 * 60 * 60 * 24);
    })
    .filter((d) => d > 0);

  const dureeeMoyenne =
    dureesMoyenne.length > 0
      ? dureesMoyenne.reduce((sum, d) => sum + d, 0) / dureesMoyenne.length
      : undefined;

  const departementsUniques = Array.from(
    new Set(allRows.map((a) => a.employe?.departement).filter(Boolean))
  ).sort() as string[];

  const typesUniques = Array.from(
    new Set(allRows.map((a) => a.materiel?.type).filter(Boolean))
  ).sort() as string[];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attributions"
        description="Attribuer et restituer le matériel — employés ou entités."
        actions={
          <>
            <AttributionFormDialog
              materiels={materiels ?? []}
              employes={employes ?? []}
              entites={entites}
            />
            <OnboardingDialog materiels={materiels ?? []} employes={employes ?? []} />
          </>
        }
      />

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
          <AttributionsFilters departements={departementsUniques} types={typesUniques} />
        </CardContent>
      </Card>

      <AttributionsTable rows={rows} />
    </div>
  );
}
