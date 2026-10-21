"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SortingState } from "@tanstack/react-table";
import type { DataTableServerMode } from "@/components/ui/data-table";
import {
  ADMIN_TABLE_DEFAULT_PAGE_SIZE,
  parseAdminTablePageIndex,
  parseAdminTablePageSize,
} from "@/lib/admin/server-table";

/** Espera tras teclear en el buscador antes de pedir la página al servidor. */
const SEARCH_DEBOUNCE_MS = 350;

type Options = {
  /** Total filtrado devuelto por el servidor. */
  rowCount: number;
  /** Página efectiva devuelta por el servidor (ya acotada a la última). */
  pageIndex: number;
  /** Parámetros de filtro propios de la tabla (cuentan como «filtros activos»). */
  filterKeys?: readonly string[];
};

/**
 * Estado de una tabla del admin paginada en servidor guardado en la URL
 * (`q`, `page`, `size`, `sort`, `dir` + filtros propios). Cada cambio hace
 * `router.replace` y el Server Component devuelve la nueva página.
 */
export function useServerDataTable({ rowCount, pageIndex, filterKeys = [] }: Options) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [optimisticQs, setOptimisticQs] = useOptimistic(searchParams.toString());
  const params = useMemo(() => new URLSearchParams(optimisticQs), [optimisticQs]);

  /** `null` o "" borra el parámetro. Salvo `keepPage`, vuelve a la primera página. */
  const setParams = useCallback(
    (patch: Record<string, string | null>, opts?: { keepPage?: boolean }) => {
      const next = new URLSearchParams(optimisticQs);
      for (const [key, value] of Object.entries(patch)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      if (!opts?.keepPage && !("page" in patch)) next.delete("page");
      const qs = next.toString();
      startTransition(() => {
        setOptimisticQs(qs);
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [optimisticQs, pathname, router, setOptimisticQs],
  );

  const urlSearch = params.get("q") ?? "";
  /** Texto mientras se escribe; `null` = sin edición pendiente (se muestra la URL). */
  const [searchDraft, setSearchDraft] = useState<string | null>(null);
  const searchText = searchDraft ?? urlSearch;

  useEffect(() => {
    if (searchDraft === null) return;
    const timer = window.setTimeout(() => {
      setSearchDraft(null);
      if (searchDraft.trim() !== urlSearch.trim()) {
        setParams({ q: searchDraft.trim() || null });
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchDraft, urlSearch, setParams]);

  const pageSize = parseAdminTablePageSize(params.get("size") ?? "");
  const sortId = params.get("sort");
  const sorting: SortingState = sortId
    ? [{ id: sortId, desc: params.get("dir") === "desc" }]
    : [];
  const hasActiveFilters =
    urlSearch.trim() !== "" || filterKeys.some((key) => Boolean(params.get(key)));

  const server: DataTableServerMode = {
    // Mientras navega se muestra la página pedida; al terminar, la acotada por el servidor.
    pageIndex: isPending ? parseAdminTablePageIndex(params.get("page") ?? "") : pageIndex,
    pageSize,
    rowCount,
    sorting,
    globalFilter: searchText,
    hasActiveFilters,
    isPending,
    onPageIndexChange: (index) =>
      setParams({ page: index > 0 ? String(index + 1) : null }),
    onPageSizeChange: (size) =>
      setParams({
        size: size === ADMIN_TABLE_DEFAULT_PAGE_SIZE ? null : String(size),
      }),
    onSortingChange: (next) => {
      const first = next[0];
      setParams({
        sort: first ? first.id : null,
        dir: first ? (first.desc ? "desc" : "asc") : null,
      });
    },
    onGlobalFilterChange: (value) => setSearchDraft(value),
  };

  return { server, params, setParams, isPending };
}
