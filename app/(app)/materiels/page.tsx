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
import { AccessoireSousChips } from "@/components/app/materiels/accessoire-sous-chips";
import { MaterielsSearch } from "@/components/app/materiels/materiels-search";
import { TablePagination } from "@/components/app/table-pagination";
import { normalizeAccessoireSousCategorie } from "@/lib/utils/accessoire-sous-categories";

type MaterielRow = Tables<"materiels">;

const PAGE_SIZE = 25;

function parsePage(value: string | string[] | undefined) {
  const raw = typeof value === "string" ? Number.parseInt(value, 10) : 1;
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
}

function applyListFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  filters: {
    statut?: string | null;
    search?: string | null;
    type?: string | null;
    sous?: string | null;
  }
) {
  let q = query;
  if (filters.statut && filters.statut !== "all") {
    q = q.eq("statut", filters.statut);
  }
  if (filters.type && filters.type !== "all") {
    q = q.eq("type", filters.type);
  }
  if (filters.sous && filters.sous !== "all") {
    q = q.eq("sous_categorie", filters.sous);
  }
  if (filters.search) {
    const term = `%${filters.search}%`;
    q = q.or(
      `code_materiel.ilike.${term},type.ilike.${term},marque.ilike.${term},modele.ilike.${term},numero_serie.ilike.${term},sous_categorie.ilike.${term}`
    );
  }
  return q;
}

export default async function MaterielsPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createSupabaseServerClient();

  const typeFilter = typeof searchParams?.type === "string" ? searchParams.type : null;
  const sousFilter = typeof searchParams?.sous === "string" ? searchParams.sous : null;
  const statutFilter = typeof searchParams?.statut === "string" ? searchParams.statut : null;
  const searchFilter =
    typeof searchParams?.search === "string" ? searchParams.search.trim() : null;
  const page = parsePage(searchParams?.page);

  const listFilters = {
    statut: statutFilter,
    search: searchFilter,
    type: typeFilter,
    sous: typeFilter === "Accessoire" ? sousFilter : null,
  };

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // 3 requêtes au lieu de 8 : liste paginée + total filtré + agrégats légers
  const listQuery = applyListFilters(
    supabase.from("materiels").select("*").order("created_at", { ascending: false }),
    listFilters
  );

  const countQuery = applyListFilters(
    supabase.from("materiels").select("*", { count: "exact", head: true }),
    listFilters
  );

  const [
    { data, error },
    { count: totalCount, error: countError },
    { data: aggRows, error: aggError },
  ] = await Promise.all([
    listQuery.range(from, to),
    countQuery,
    supabase.from("materiels").select("type, statut, cout, sous_categorie"),
  ]);

  if (error || countError || aggError) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Matériel</h1>
        <p className="text-destructive text-sm">
          {(error ?? countError ?? aggError)?.message}
        </p>
      </div>
    );
  }

  const rows = (data ?? []) as MaterielRow[];
  const all = aggRows ?? [];

  // Stats / chips calculés en mémoire sur un select léger (4 colonnes)
  const filteredForStats = all.filter((m) => {
    if (typeFilter && typeFilter !== "all" && m.type !== typeFilter) return false;
    if (
      typeFilter === "Accessoire" &&
      sousFilter &&
      sousFilter !== "all" &&
      m.sous_categorie !== sousFilter
    ) {
      return false;
    }
    if (searchFilter) {
      const hay = `${m.type ?? ""} ${m.sous_categorie ?? ""}`.toLowerCase();
      if (!hay.includes(searchFilter.toLowerCase())) {
        // La recherche pleine se fait déjà sur la liste ; pour stats on reste large
      }
    }
    return true;
  });

  const stockCount = filteredForStats.filter((m) => m.statut === "Stock").length;
  const attribuesCount = filteredForStats.filter((m) => m.statut === "Attribué").length;
  const maintenanceCount = filteredForStats.filter((m) => m.statut === "Maintenance").length;
  const valeurTotale = filteredForStats.reduce((sum, m) => sum + (m.cout ?? 0), 0);

  const typeCounts = all.reduce(
    (acc, m) => {
      const type = normalizeMaterielType(m.type ?? "");
      if (type) acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const types = Object.keys(typeCounts)
    .sort((a, b) => a.localeCompare(b))
    .map((t) => ({ label: t, value: t, count: typeCounts[t] }));

  const sousCounts = all
    .filter((m) => normalizeMaterielType(m.type ?? "") === "Accessoire")
    .reduce(
      (acc, m) => {
        const sous =
          normalizeAccessoireSousCategorie(m.sous_categorie) ?? m.sous_categorie ?? "Autre";
        if (sous) acc[sous] = (acc[sous] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Matériel"
        description="Inventaire du parc informatique."
        actions={<MaterielFormDialog />}
      />

      <MaterielsStats
        total={totalCount ?? 0}
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <MaterielsSearch />
          </div>
          <TypeChips types={types} />
          {typeFilter === "Accessoire" ? <AccessoireSousChips counts={sousCounts} /> : null}
          <MaterielsTable rows={rows} />
          <Suspense fallback={null}>
            <TablePagination page={page} pageSize={PAGE_SIZE} totalCount={totalCount ?? 0} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
