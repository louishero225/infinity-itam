import Link from "next/link";
import type { Tables } from "@/lib/types/database";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getEntitesWithMaterielCount } from "@/app/(app)/entites/actions";

import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeFormDialog } from "@/components/app/employes/employe-form-dialog";
import { EmployesTable } from "@/components/app/employes/employes-table";
import { EntitesTable } from "@/components/app/destinataires/entites-table";
import { EntiteFormDialog } from "@/components/app/destinataires/entite-form-dialog";
import { OnboardingDialog } from "@/components/app/attributions/onboarding-dialog";
import { Button } from "@/components/ui/button";

type EmployeRow = Tables<"employes"> & {
  materiel_actif?: number;
};

export default async function DestinatairesPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const tab = typeof searchParams?.tab === "string" ? searchParams.tab : "personnes";
  const supabase = await createSupabaseServerClient();

  const [employesResult, materielsResult, entites] = await Promise.all([
    supabase
      .from("employes")
      .select(
        `*,
        attributions!employe_id ( id, statut )`
      )
      .order("prenom"),
    supabase
      .from("materiels")
      .select("id, code_materiel, type, marque, modele")
      .eq("statut", "Stock")
      .order("code_materiel"),
    getEntitesWithMaterielCount(),
  ]);

  const { data, error } = employesResult;
  const materiels = materielsResult.data ?? [];

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Destinataires</h1>
        <p className="text-destructive text-sm">{error.message}</p>
      </div>
    );
  }

  const employes: EmployeRow[] = (data ?? []).map((e) => {
    const attrs = (e as { attributions?: { statut: string | null }[] }).attributions ?? [];
    return {
      ...e,
      materiel_actif: attrs.filter((a) => a.statut === "Actif").length,
    };
  });

  const employesOptions = employes.map((e) => ({
    id: e.id,
    prenom: e.prenom,
    nom: e.nom,
    departement: e.departement,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Destinataires"
        description="Personnes et entités pouvant recevoir du matériel."
        actions={
          tab === "personnes" ? (
            <>
              <EmployeFormDialog />
              <OnboardingDialog materiels={materiels} employes={employesOptions} />
            </>
          ) : (
            <EntiteFormDialog />
          )
        }
      />

      <div className="flex gap-2 border-b pb-2">
        <Button variant={tab !== "entites" ? "default" : "outline"} size="sm" asChild>
          <Link href="/destinataires?tab=personnes">Personnes ({employes.length})</Link>
        </Button>
        <Button variant={tab === "entites" ? "default" : "outline"} size="sm" asChild>
          <Link href="/destinataires?tab=entites">Entités ({entites.length})</Link>
        </Button>
      </div>

      {tab === "entites" ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Départements, sociétés et sites</CardTitle>
          </CardHeader>
          <CardContent>
            <EntitesTable rows={entites} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Employés</CardTitle>
          </CardHeader>
          <CardContent>
            <EmployesTable rows={employes} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
