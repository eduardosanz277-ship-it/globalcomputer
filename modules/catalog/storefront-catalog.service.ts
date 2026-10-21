import type { Locale } from "@/components/i18n/translations";
import { assertRemoteOk } from "@/lib/errors/rsc-network-error";
import type { StorefrontPriceTier } from "@/lib/storefront-pricing";
import { getCatalogSupabase, withCatalogCache } from "@/lib/supabaseCatalogClient";
import {
  parseStorefrontCatalogPrice,
  parseStorefrontCatalogQuery,
  type StorefrontCatalogFacets,
  type StorefrontCatalogPageData,
} from "@/modules/catalog/storefront-catalog.shared";
import type { StorefrontProduct } from "@/modules/catalog/storefront-product.shared";
import {
  mapStorefrontProductRow,
  STOREFRONT_PRODUCT_SELECT,
} from "@/modules/catalog/storefront-products.service";

/** Conjunto de productos de cada listado (antes, una consulta `listProductsBy…` por página). */
export type StorefrontCatalogScope =
  | { kind: "all" }
  | { kind: "featured" }
  | { kind: "offers" }
  | { kind: "brand"; brandId: string }
  | { kind: "brand_type"; brandId: string; brandTypeId: string }
  | { kind: "category"; categoryId: string }
  | { kind: "subcategory"; subcategoryId: string }
  | { kind: "general"; generalId: string }
  | { kind: "specific"; specificId: string };

type ScopeArgs = { p_scope: string; p_scope_id: string | null; p_scope_id2: string | null };

function scopeArgs(scope: StorefrontCatalogScope): ScopeArgs {
  switch (scope.kind) {
    case "brand":
      return { p_scope: "brand", p_scope_id: scope.brandId, p_scope_id2: null };
    case "brand_type":
      return { p_scope: "brand_type", p_scope_id: scope.brandId, p_scope_id2: scope.brandTypeId };
    case "category":
      return { p_scope: "category", p_scope_id: scope.categoryId, p_scope_id2: null };
    case "subcategory":
      return { p_scope: "subcategory", p_scope_id: scope.subcategoryId, p_scope_id2: null };
    case "general":
      return { p_scope: "general", p_scope_id: scope.generalId, p_scope_id2: null };
    case "specific":
      return { p_scope: "specific", p_scope_id: scope.specificId, p_scope_id2: null };
    default:
      return { p_scope: scope.kind, p_scope_id: null, p_scope_id2: null };
  }
}

function toNumberOrNull(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

type FacetsRow = {
  total?: unknown;
  brands?: StorefrontCatalogFacets["brands"];
  categories?: StorefrontCatalogFacets["categories"];
  specifics?: StorefrontCatalogFacets["specifics"];
  price_client?: { min?: unknown; max?: unknown };
  price_business?: { min?: unknown; max?: unknown };
};

const getCatalogFacets = withCatalogCache(
  "storefront-catalog-facets",
  async (args: ScopeArgs): Promise<StorefrontCatalogFacets> => {
    const supabase = await getCatalogSupabase();
    const { data, error } = await supabase.rpc("storefront_catalog_facets", args);
    if (error) assertRemoteOk(error);
    const row = (data ?? {}) as FacetsRow;
    return {
      total: Number(row.total ?? 0),
      brands: (row.brands ?? []).map((b) => ({
        id: String(b.id),
        name: String(b.name),
        name_en: b.name_en ?? null,
      })),
      categories: (row.categories ?? []).map((c) => ({
        id: String(c.id),
        name: c.name ?? null,
        name_en: c.name_en ?? null,
      })),
      specifics: (row.specifics ?? []).map((s) => ({
        id: String(s.id),
        name: String(s.name),
        name_en: s.name_en ?? null,
        general_id: String(s.general_id),
        general_name: String(s.general_name),
        general_name_en: s.general_name_en ?? null,
      })),
      priceClient: {
        min: toNumberOrNull(row.price_client?.min),
        max: toNumberOrNull(row.price_client?.max),
      },
      priceBusiness: {
        min: toNumberOrNull(row.price_business?.min),
        max: toNumberOrNull(row.price_business?.max),
      },
    };
  },
);

type PageArgs = ScopeArgs & {
  p_tier: StorefrontPriceTier;
  p_locale: Locale;
  p_query: string | null;
  p_brand_ids: string[] | null;
  p_category_ids: string[] | null;
  p_specific_ids: string[] | null;
  p_price_min: number | null;
  p_price_max: number | null;
  p_stock: string[] | null;
  p_discount_only: boolean;
  p_sort: string;
  p_page: number;
  p_page_size: number;
};

type PageResult = {
  products: StorefrontProduct[];
  filteredCount: number;
  pageIndex: number;
};

/** Productos de vitrina por ids conservando el orden recibido. */
export async function getStorefrontProductsInOrder(
  ids: string[],
): Promise<StorefrontProduct[]> {
  if (ids.length === 0) return [];
  const supabase = await getCatalogSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(STOREFRONT_PRODUCT_SELECT)
    .in("id", ids)
    .eq("active", true);
  if (error) assertRemoteOk(error);
  const byId = new Map(
    (data ?? []).map((row) => {
      const product = mapStorefrontProductRow(row as Record<string, unknown>);
      return [product.id, product] as const;
    }),
  );
  return ids.flatMap((id) => {
    const product = byId.get(id);
    return product ? [product] : [];
  });
}

const getCatalogPage = withCatalogCache(
  "storefront-catalog-page",
  async (args: PageArgs): Promise<PageResult> => {
    const supabase = await getCatalogSupabase();
    const { data, error } = await supabase.rpc("storefront_catalog_page", args);
    if (error) assertRemoteOk(error);
    const row = (data ?? {}) as { ids?: unknown; filtered_count?: unknown; page?: unknown };
    const ids = Array.isArray(row.ids) ? row.ids.map(String) : [];
    return {
      products: await getStorefrontProductsInOrder(ids),
      filteredCount: Number(row.filtered_count ?? 0),
      pageIndex: Number(row.page ?? 0),
    };
  },
);

/**
 * Página del catálogo de tienda: filtra, ordena y pagina en la base de datos
 * con el estado de la URL, y devuelve solo los productos visibles.
 */
export async function loadStorefrontCatalogPage(
  scope: StorefrontCatalogScope,
  searchParams: Record<string, string | string[] | undefined>,
  priceTier: StorefrontPriceTier,
  locale: Locale,
): Promise<StorefrontCatalogPageData> {
  const query = parseStorefrontCatalogQuery(searchParams);
  const scopeParams = scopeArgs(scope);
  const nonEmpty = (list: string[]) => (list.length > 0 ? list : null);
  // El idioma solo cambia el resultado al buscar u ordenar por nombre; fuera de eso
  // se fija para que ambos idiomas compartan la misma entrada de caché.
  const localeMatters = query.q !== "" || query.sort === "name_asc" || query.sort === "name_desc";

  const [facets, page] = await Promise.all([
    getCatalogFacets(scopeParams),
    getCatalogPage({
      ...scopeParams,
      p_tier: priceTier,
      p_locale: localeMatters ? locale : "es",
      p_query: query.q || null,
      p_brand_ids: nonEmpty(query.brandIds),
      p_category_ids: nonEmpty(query.categoryIds),
      p_specific_ids: nonEmpty(query.specificIds),
      p_price_min: parseStorefrontCatalogPrice(query.priceMin),
      p_price_max: parseStorefrontCatalogPrice(query.priceMax),
      p_stock: nonEmpty(query.stock),
      p_discount_only: query.discountOnly,
      p_sort: query.sort,
      p_page: query.page,
      p_page_size: query.pageSize,
    }),
  ]);

  return {
    products: page.products,
    facets,
    filteredCount: page.filteredCount,
    query: { ...query, page: page.pageIndex },
    locale,
  };
}
