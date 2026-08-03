"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  nextSortConfig,
  sortRows,
  type SortConfig,
  type SortValue,
} from "@/lib/utils/table-sort";
import { TableHead } from "@/components/ui/table";

type SortableTableHeadProps = {
  label: string;
  sortKey: string;
  sort: SortConfig;
  onSort: (key: string) => void;
  className?: string;
};

export function SortableTableHead({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: SortableTableHeadProps) {
  const active = sort?.key === sortKey;
  const Icon = active ? (sort.direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 font-medium transition-colors hover:text-foreground",
          active ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
        <Icon className={cn("size-3.5", !active && "opacity-40")} />
      </button>
    </TableHead>
  );
}

export function useSortableRows<T>(
  data: T[],
  accessors: Record<string, (row: T) => SortValue>
) {
  const [sort, setSort] = React.useState<SortConfig>(null);

  const toggleSort = React.useCallback((key: string) => {
    setSort((current) => nextSortConfig(current, key));
  }, []);

  const sortedData = React.useMemo(
    () =>
      sortRows(data, sort, (row, key) => {
        const accessor = accessors[key];
        return accessor ? accessor(row) : null;
      }),
    [accessors, data, sort]
  );

  const renderHead = React.useCallback(
    (sortKey: string, label: string, className?: string) => (
      <SortableTableHead
        key={sortKey}
        sortKey={sortKey}
        label={label}
        sort={sort}
        onSort={toggleSort}
        className={className}
      />
    ),
    [sort, toggleSort]
  );

  return { sortedData, sort, toggleSort, renderHead };
}
