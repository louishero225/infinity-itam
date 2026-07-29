"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  searchableText?: (row: T) => string;
};

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = "Rechercher...",
  hideSearch = false,
}: {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  hideSearch?: boolean;
}) {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    if (hideSearch) return data;
    const q = query.trim().toLowerCase();
    if (!q) return data;

    return data.filter((row) =>
      columns.some((c) => (c.searchableText ? c.searchableText(row) : "").toLowerCase().includes(q))
    );
  }, [columns, data, query, hideSearch]);

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
          <div className="text-muted-foreground text-sm">{filtered.length} résultats</div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead key={c.key}>{c.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((row, idx) => (
            <TableRow key={idx}>
              {columns.map((c) => (
                <TableCell key={c.key}>{c.cell(row)}</TableCell>
              ))}
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-muted-foreground">
                Aucun résultat.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
