/**
 * Estado de las tablas del admin paginadas en servidor, leído de la URL.
 * Puro: lo usan las páginas (servidor) y `useServerDataTable` (cliente).
 *
 * Parámetros: `q` búsqueda, `page` (1-based), `size`, `sort` (id de columna), `dir` (asc|desc).
 */

export const ADMIN_TABLE_PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;
/** Igual que el `defaultPageSize` del `DataTable`. */
export const ADMIN_TABLE_DEFAULT_PAGE_SIZE = 10;

export type AdminTableSearchParams =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

export type AdminTableSort = { id: string; desc: boolean } | null;

export type AdminTableQuery = {
  q: string;
  /** 0-based. */
  pageIndex: number;
  pageSize: number;
  sort: AdminTableSort;
};

export function readAdminTableParam(
  params: AdminTableSearchParams,
  key: string,
): string {
  if (params instanceof URLSearchParams) return params.get(key) ?? "";
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function parseAdminTablePageSize(raw: string): number {
  const n = Number.parseInt(raw, 10);
  return (ADMIN_TABLE_PAGE_SIZE_OPTIONS as readonly number[]).includes(n)
    ? n
    : ADMIN_TABLE_DEFAULT_PAGE_SIZE;
}

export function parseAdminTablePageIndex(raw: string): number {
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 1 ? n - 1 : 0;
}

/** `allowedSortIds`: columnas ordenables; cualquier otro valor se ignora. */
export function parseAdminTableQuery(
  params: AdminTableSearchParams,
  allowedSortIds: readonly string[],
): AdminTableQuery {
  const sortId = readAdminTableParam(params, "sort");
  const dir = readAdminTableParam(params, "dir");
  return {
    q: readAdminTableParam(params, "q").trim().slice(0, 120),
    pageIndex: parseAdminTablePageIndex(readAdminTableParam(params, "page")),
    pageSize: parseAdminTablePageSize(readAdminTableParam(params, "size")),
    sort: allowedSortIds.includes(sortId)
      ? { id: sortId, desc: dir === "desc" }
      : null,
  };
}

/** Resultado de una página: filas visibles, total filtrado y página efectiva (acotada). */
export type AdminTablePage<T> = {
  rows: T[];
  rowCount: number;
  pageIndex: number;
};
