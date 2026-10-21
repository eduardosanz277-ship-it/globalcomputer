/**
 * Estado del catálogo paginado en servidor (filtros, orden y página en la URL).
 * Sin Supabase: importable desde Client Components.
 */

import type { Locale } from "@/components/i18n/translations";
import type { StorefrontProduct } from "@/modules/catalog/storefront-product.shared";

export const STOREFRONT_CATALOG_PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;
export const STOREFRONT_CATALOG_DEFAULT_PAGE_SIZE = 20;

export type StorefrontCatalogStockFilter = "in_stock" | "low" | "out";

export type StorefrontCatalogSort =
  | "relevance"
  | "price_asc"
  | "price_desc"
  | "name_asc"
  | "name_desc"
  | "date_desc"
  | "date_asc";

export type StorefrontCatalogQuery = {
  q: string;
  brandIds: string[];
  categoryIds: string[];
  specificIds: string[];
  /** Texto tal cual se escribió (el filtro aplica si es un número). */
  priceMin: string;
  priceMax: string;
  stock: StorefrontCatalogStockFilter[];
  discountOnly: boolean;
  sort: StorefrontCatalogSort;
  /** Índice 0-based (en la URL va 1-based). */
  page: number;
  pageSize: number;
};

/** Opciones de filtro del listado completo (no dependen de los filtros activos). */
export type StorefrontCatalogFacets = {
  total: number;
  brands: { id: string; name: string; name_en: string | null }[];
  categories: { id: string; name: string | null; name_en: string | null }[];
  specifics: {
    id: string;
    name: string;
    name_en: string | null;
    general_id: string;
    general_name: string;
    general_name_en: string | null;
  }[];
  priceClient: { min: number | null; max: number | null };
  priceBusiness: { min: number | null; max: number | null };
};

/** Datos de una página del catálogo resueltos en servidor. */
export type StorefrontCatalogPageData = {
  /** Productos de la página actual, en orden. */
  products: StorefrontProduct[];
  facets: StorefrontCatalogFacets;
  /** Total de productos que cumplen los filtros. */
  filteredCount: number;
  /** Estado de la URL con la página ya acotada a la última existente. */
  query: StorefrontCatalogQuery;
  /** Idioma con el que se resolvieron búsqueda y orden por nombre. */
  locale: Locale;
};

const SORT_VALUES: readonly StorefrontCatalogSort[] = [
  "relevance",
  "price_asc",
  "price_desc",
  "name_asc",
  "name_desc",
  "date_desc",
  "date_asc",
];

const STOCK_VALUES: readonly StorefrontCatalogStockFilter[] = [
  "in_stock",
  "low",
  "out",
];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Nombres de parámetros en la URL. `q` ya lo usaba el buscador. */
const PARAM = {
  q: "q",
  brand: "brand",
  category: "category",
  spec: "spec",
  priceMin: "pmin",
  priceMax: "pmax",
  stock: "stock",
  offers: "offers",
  sort: "sort",
  page: "page",
  size: "size",
} as const;

type RawSearchParams =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function readParam(params: RawSearchParams, key: string): string {
  if (params instanceof URLSearchParams) return params.get(key) ?? "";
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function readIdList(params: RawSearchParams, key: string): string[] {
  const raw = readParam(params, key);
  if (!raw) return [];
  return [...new Set(raw.split(",").map((s) => s.trim()).filter((s) => UUID_RE.test(s)))];
}

export const STOREFRONT_CATALOG_DEFAULT_QUERY: StorefrontCatalogQuery = {
  q: "",
  brandIds: [],
  categoryIds: [],
  specificIds: [],
  priceMin: "",
  priceMax: "",
  stock: [],
  discountOnly: false,
  sort: "relevance",
  page: 0,
  pageSize: STOREFRONT_CATALOG_DEFAULT_PAGE_SIZE,
};

export function parseStorefrontCatalogQuery(
  params: RawSearchParams,
): StorefrontCatalogQuery {
  const sortRaw = readParam(params, PARAM.sort);
  const sort = (SORT_VALUES as readonly string[]).includes(sortRaw)
    ? (sortRaw as StorefrontCatalogSort)
    : "relevance";

  const stock = readParam(params, PARAM.stock)
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is StorefrontCatalogStockFilter =>
      (STOCK_VALUES as readonly string[]).includes(s),
    );

  const pageRaw = Number.parseInt(readParam(params, PARAM.page), 10);
  const sizeRaw = Number.parseInt(readParam(params, PARAM.size), 10);
  const pageSize = (STOREFRONT_CATALOG_PAGE_SIZE_OPTIONS as readonly number[]).includes(sizeRaw)
    ? sizeRaw
    : STOREFRONT_CATALOG_DEFAULT_PAGE_SIZE;

  return {
    q: readParam(params, PARAM.q).trim(),
    brandIds: readIdList(params, PARAM.brand),
    categoryIds: readIdList(params, PARAM.category),
    specificIds: readIdList(params, PARAM.spec),
    priceMin: readParam(params, PARAM.priceMin).slice(0, 32),
    priceMax: readParam(params, PARAM.priceMax).slice(0, 32),
    stock: [...new Set(stock)],
    discountOnly: readParam(params, PARAM.offers) === "1",
    sort,
    page: Number.isFinite(pageRaw) && pageRaw > 1 ? pageRaw - 1 : 0,
    pageSize,
  };
}

/**
 * Escribe el estado en `base` (conserva parámetros ajenos al catálogo).
 * Los valores por defecto no se escriben para mantener URLs limpias.
 */
export function writeStorefrontCatalogQuery(
  query: StorefrontCatalogQuery,
  base: URLSearchParams,
): URLSearchParams {
  const params = new URLSearchParams(base.toString());
  const set = (key: string, value: string) => {
    if (value) params.set(key, value);
    else params.delete(key);
  };
  set(PARAM.q, query.q.trim());
  set(PARAM.brand, query.brandIds.join(","));
  set(PARAM.category, query.categoryIds.join(","));
  set(PARAM.spec, query.specificIds.join(","));
  set(PARAM.priceMin, query.priceMin.trim() === "" ? "" : query.priceMin);
  set(PARAM.priceMax, query.priceMax.trim() === "" ? "" : query.priceMax);
  set(PARAM.stock, query.stock.join(","));
  set(PARAM.offers, query.discountOnly ? "1" : "");
  set(PARAM.sort, query.sort === "relevance" ? "" : query.sort);
  set(PARAM.page, query.page > 0 ? String(query.page + 1) : "");
  set(
    PARAM.size,
    query.pageSize === STOREFRONT_CATALOG_DEFAULT_PAGE_SIZE ? "" : String(query.pageSize),
  );
  return params;
}

/** Mismo criterio que el filtro anterior: vacío o no numérico → sin límite. */
export function parseStorefrontCatalogPrice(raw: string): number | null {
  if (raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
