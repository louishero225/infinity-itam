export type SortDirection = "asc" | "desc";

export type SortConfig = {
  key: string;
  direction: SortDirection;
} | null;

export type SortValue = string | number | null | undefined;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

export function compareSortValues(a: SortValue, b: SortValue, direction: SortDirection): number {
  const factor = direction === "asc" ? 1 : -1;

  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  if (typeof a === "number" && typeof b === "number") {
    return (a - b) * factor;
  }

  const strA = String(a);
  const strB = String(b);

  const numA = Number(strA);
  const numB = Number(strB);
  if (!Number.isNaN(numA) && !Number.isNaN(numB) && strA.trim() !== "" && strB.trim() !== "") {
    return (numA - numB) * factor;
  }

  if (ISO_DATE.test(strA) && ISO_DATE.test(strB)) {
    const timeA = Date.parse(strA);
    const timeB = Date.parse(strB);
    if (!Number.isNaN(timeA) && !Number.isNaN(timeB)) {
      return (timeA - timeB) * factor;
    }
  }

  return strA.localeCompare(strB, "fr", { sensitivity: "base", numeric: true }) * factor;
}

export function sortRows<T>(
  data: T[],
  sort: SortConfig,
  getValue: (row: T, key: string) => SortValue
): T[] {
  if (!sort) return data;
  return [...data].sort((a, b) =>
    compareSortValues(getValue(a, sort.key), getValue(b, sort.key), sort.direction)
  );
}

export function nextSortConfig(current: SortConfig, key: string): SortConfig {
  if (current?.key !== key) return { key, direction: "asc" };
  if (current.direction === "asc") return { key, direction: "desc" };
  return null;
}
