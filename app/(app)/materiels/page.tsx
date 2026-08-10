import type { Tables } from "@/lib/types/database";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeMaterielType } from "@/lib/utils/materiel-taxonomy";

import { Suspense } from "react";

import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaterielFormDialog } from "@/components/app/materiels/materiel-form-dialog";
import { MaterielsTable } from "@/components/app/materiels/materiels-table";
import { MaterielsStats } from "@/components/app/materiels/materiels-stats";
import { TypeChips } from "@/components/app/materiels/type-chips";
import { MaterielsSearch } from "@/components/app/materiels/materiels-search";
import { TablePagination } from "@/components/app/table-pagination";

type MaterielRow = Tables<"materiels">;

const PAGE_SIZE = 25;

function parsePage(value: string | string[] | undefined) {
  const raw = typeof value === "string" ? Number.parseInt(value, 10) : 1;
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
}

async function countMateriels(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  filters: { statut?: string | null; search?: string | null; type?: string | null }
) {
  let query = supabase.from("materiels").select("*", { count: "exact", head: true });

  if (filters.statut && filters.statut !== "all") {
    query = query.eq("statut", filters.statut);
  }

  if (filters.type && filters.type !== "all") {
    query = query.eq("type", filters.type);
  }

  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(
      `code_materiel.ilike.${term},type.ilike.${term},marque.ilike.${term},modele.ilike.${term},numero_serie.ilike.${term}`
    );
  }

  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export default async function MaterielsPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createSupabaseServerClient();

  const typeFilter = typeof searchParams?.type === "string" ? searchParams.type : null;
  const statutFilter = typeof searchParams?.statut === "string" ? searchParams.statut : null;
  const searchFilter =
    typeof searchParams?.search === "string" ? searchParams.search.trim() : null;
  const page = parsePage(searchParams?.page);

  let listQuery = supabase
    .from("materiels")
    .select("*")
    .order("created_at", { ascending: false });

  if (statutFilter && statutFilter !== "all") {
    listQuery = listQuery.eq("statut", statutFilter);
  }

  if (typeFilter && typeFilter !== "all") {
    listQuery = listQuery.eq("type", typeFilter);
  }

  if (searchFilter) {
    const term = `%${searchFilter}%`;
    listQuery = listQuery.or(
      `code_materiel.ilike.${term},type.ilike.${term},marque.ilike.${term},modele.ilike.${term},numero_serie.ilike.${term}`
    );
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const [
    { data, error },
    totalCount,
    { data: typeRows },
    { data: coutRows },
    stockCount,
    attribuesCount,
    maintenanceCount,
  ] = await Promise.all([
    listQuery.range(from, to).returns<MaterielRow[]>(),
    countMateriels(supabase, {
      statut: statutFilter,
      search: searchFilter,
      type: typeFilter,
    }),
    supabase.from("materiels").select("type"),
    (() => {
      let q = supabase.from("materiels").select("cout");
      if (statutFilter && statutFilter !== "all") q = q.eq("statut", statutFilter);
      if (typeFilter && typeFilter !== "all") q = q.eq("type", typeFilter);
      if (searchFilter) {
        const term = `%${searchFilter}%`;
        q = q.or(
          `code_materiel.ilike.${term},type.ilike.${term},marque.ilike.${term},modele.ilike.${term},numero_serie.ilike.${term}`
        );
      }
      return q;
    })(),
    countMateriels(supabase, { statut: "Stock", search: searchFilter, type: typeFilter }),
    countMateriels(supabase, { statut: "Attribué", search: searchFilter, type: typeFilter }),
    countMateriels(supabase, { statut: "Maintenance", search: searchFilter, type: typeFilter }),
  ]);

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Matériel</h1>
        <p className="text-destructive text-sm">{error.message}</p>
      </div>
    );
  }

  const rows = data ?? [];

  const valeurTotale = (coutRows ?? []).reduce((sum, m) => sum + (m.cout ?? 0), 0);

  const typeCounts = (typeRows ?? []).reduce(
    (acc, m) => {
      const type = normalizeMaterielType(m.type ?? "");
      if (type) {
        acc[type] = (acc[type] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  const types = Object.keys(typeCounts)
    .sort((a, b) => a.localeCompare(b))
    .map((t) => ({ label: t, value: t, count: typeCounts[t] }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Matériel"
        description="Inventaire du parc informatique."
        actions={<MaterielFormDialog />}
      />

      <MaterielsStats
        total={totalCount}
        stock={stockCount}
        attribues={attribuesCount}
        maintenance={maintenanceCount}
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
          <MaterielsTable rows={rows} />
          <Suspense fallback={null}>
            <TablePagination page={page} pageSize={PAGE_SIZE} totalCount={totalCount} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
