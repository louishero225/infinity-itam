import type { Tables } from "@/lib/types/database";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeMaterielType } from "@/lib/utils/materiel-taxonomy";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaterielFormDialog } from "@/components/app/materiels/materiel-form-dialog";
import { MaterielsTable } from "@/components/app/materiels/materiels-table";
import { MaterielsStats } from "@/components/app/materiels/materiels-stats";
import { TypeChips } from "@/components/app/materiels/type-chips";
import { MaterielsSearch } from "@/components/app/materiels/materiels-search";

type MaterielRow = Tables<"materiels">;

export default async function MaterielsPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createSupabaseServerClient();

  const typeFilter = typeof searchParams?.type === "string" ? searchParams.type : null;
  const statutFilter = typeof searchParams?.statut === "string" ? searchParams.statut : null;
  const searchFilter = typeof searchParams?.search === "string" ? searchParams.search.toLowerCase() : null;

  const { data, error } = await supabase
    .from("materiels")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<MaterielRow[]>();

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Matériel</h1>
        <p className="text-destructive text-sm">{error.message}</p>
      </div>
    );
  }

  const allRows = data ?? [];

  const filtered = allRows.filter((m) => {
    if (typeFilter && typeFilter !== "all" && normalizeMaterielType(m.type ?? "") !== typeFilter)
      return false;
    if (statutFilter && statutFilter !== "all" && (m.statut ?? "Stock") !== statutFilter)
      return false;
    if (searchFilter) {
      const searchText = [
        m.code_materiel,
        m.type,
        m.marque,
        m.modele,
        m.numero_serie,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!searchText.includes(searchFilter)) return false;
    }
    return true;
  });

  const valeurTotale = filtered.reduce((sum, m) => sum + (m.cout ?? 0), 0);

  const typeCounts = allRows.reduce((acc, m) => {
    const type = normalizeMaterielType(m.type ?? "");
    if (type) {
      acc[type] = (acc[type] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const types = Object.keys(typeCounts)
    .sort((a, b) => a.localeCompare(b))
    .map((t) => ({ label: t, value: t, count: typeCounts[t] }));

  const total = filtered.length;
  const stock = filtered.filter((m) => (m.statut ?? "Stock") === "Stock").length;
  const attribues = filtered.filter((m) => (m.statut ?? "Stock") === "Attribué").length;
  const maintenance = filtered.filter((m) => (m.statut ?? "Stock") === "Maintenance").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Matériel</h1>
          <p className="text-muted-foreground text-sm">Inventaire du parc informatique.</p>
        </div>
        <MaterielFormDialog />
      </div>

      <MaterielsStats 
        total={total} 
        stock={stock} 
        attribues={attribues} 
        maintenance={maintenance}
        valeurTotale={valeurTotale}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Liste du matériel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <MaterielsSearch />
          </div>
          <TypeChips types={types} />
          <MaterielsTable rows={filtered} />
        </CardContent>
      </Card>
    </div>
  );
}
