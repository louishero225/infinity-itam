"use client";

import { usePathname, useSearchParams } from "next/navigation";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type TablePaginationProps = {
  page: number;
  pageSize: number;
  totalCount: number;
  paramName?: string;
};

function buildHref(
  pathname: string,
  searchParams: URLSearchParams,
  page: number,
  paramName: string
) {
  const params = new URLSearchParams(searchParams.toString());
  if (page <= 1) {
    params.delete(paramName);
  } else {
    params.set(paramName, String(page));
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function TablePagination({
  page,
  pageSize,
  totalCount,
  paramName = "page",
}: TablePaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (totalPages <= 1) return null;

  const pages: (number | "ellipsis")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "ellipsis") {
      pages.push("ellipsis");
    }
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
      <p className="text-muted-foreground text-sm">
        {from}–{to} sur {totalCount} résultat{totalCount > 1 ? "s" : ""}
      </p>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href={page > 1 ? buildHref(pathname, searchParams, page - 1, paramName) : "#"}
              aria-disabled={page <= 1}
              className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
            />
          </PaginationItem>
          {pages.map((p, index) =>
            p === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink
                  href={buildHref(pathname, searchParams, p, paramName)}
                  isActive={p === page}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext
              href={
                page < totalPages
                  ? buildHref(pathname, searchParams, page + 1, paramName)
                  : "#"
              }
              aria-disabled={page >= totalPages}
              className={page >= totalPages ? "pointer-events-none opacity-50" : undefined}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
