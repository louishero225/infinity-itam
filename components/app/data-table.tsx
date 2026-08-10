"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { EmptyState } from "@/components/app/empty-state";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { nextSortConfig, sortRows, type SortValue } from "@/lib/utils/table-sort";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  searchableText?: (row: T) => string;
  sortValue?: (row: T) => SortValue;
  sortable?: boolean;
  headerClassName?: string;
};

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = "Rechercher...",
  hideSearch = false,
  getRowKey,
}: {
  data: T[];
  columns: DataTableColumn<T>[];
  searchPlaceholder?: string;
  hideSearch?: boolean;
  getRowKey?: (row: T, index: number) => string;
}) {
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<{ key: string; direction: "asc" | "desc" } | null>(
    null
  );

  const isSortable = React.useCallback(
    (column: DataTableColumn<T>) => {
      if (column.sortable === false) return false;
      return Boolean(column.sortValue ?? column.searchableText);
    },
    []
  );

  const getSortValue = React.useCallback(
    (row: T, column: DataTableColumn<T>) => {
      if (column.sortValue) return column.sortValue(row);
      if (column.searchableText) return column.searchableText(row);
      return null;
    },
    []
  );

  const filtered = React.useMemo(() => {
    if (hideSearch) return data;
    const q = query.trim().toLowerCase();
    if (!q) return data;

    return data.filter((row) =>
      columns.some((c) =>
        (c.searchableText ? c.searchableText(row) : "").toLowerCase().includes(q)
      )
    );
  }, [columns, data, hideSearch, query]);

  const sorted = React.useMemo(() => {
    if (!sort) return filtered;
    const column = columns.find((c) => c.key === sort.key);
    if (!column || !isSortable(column)) return filtered;

    return sortRows(filtered, sort, (row, key) => {
      const column = columns.find((c) => c.key === key);
      if (!column) return null;
      return getSortValue(row, column);
    });
  }, [columns, filtered, getSortValue, isSortable, sort]);

  const toggleSort = (key: string) => {
    setSort((current) => nextSortConfig(current, key));
  };

  return (
    <div className="flex flex-col gap-3">
      {!hideSearch && (
        <div className="flex items-center gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="max-w-sm"
          />
          <div className="text-muted-foreground text-sm">{sorted.length} résultats</div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c) => {
              const sortable = isSortable(c);
              const active = sort?.key === c.key;
              const Icon = active
                ? sort.direction === "asc"
                  ? ArrowUp
                  : ArrowDown
                : ArrowUpDown;

              if (!sortable) {
                return (
                  <TableHead key={c.key} className={c.headerClassName}>
                    {c.header}
                  </TableHead>
                );
              }

              return (
                <TableHead key={c.key} className={c.headerClassName}>
                  <button
                    type="button"
                    onClick={() => toggleSort(c.key)}
                    className={cn(
                      "inline-flex items-center gap-1 font-medium transition-colors hover:text-foreground",
                      active ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {c.header}
                    <Icon className={cn("size-3.5", !active && "opacity-40")} />
                  </button>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((row, idx) => (
            <TableRow key={getRowKey ? getRowKey(row, idx) : idx}>
              {columns.map((c) => (
                <TableCell key={c.key}>{c.cell(row)}</TableCell>
              ))}
            </TableRow>
          ))}
          {sorted.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} className="p-0">
                <EmptyState
                  title="Aucun résultat"
                  description={
                    query.trim()
                      ? "Aucun élément ne correspond à votre recherche."
                      : "Aucune donnée à afficher pour le moment."
                  }
                  className="border-0 bg-transparent my-4"
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
