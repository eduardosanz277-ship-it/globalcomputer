import { getCatalogSupabase } from "@/lib/supabaseCatalogClient";
import {
  mapStorefrontProductRow,
  STOREFRONT_PRODUCT_SELECT,
  type StorefrontProduct,
} from "@/modules/catalog/storefront-products.service";

const MAX_SIMILAR = 8;
/** Margen ±20 % sobre el precio base del producto. */
const PRICE_BAND = 0.2;

export type SimilarProductsParams = {
  productId: string;
  categoriaId: string | null;
  subcategoryId: string | null;
  marcaId: string;
  tipoProductoId: string | null;
  precio: number;
};

function mapRows(data: unknown[] | null): StorefrontProduct[] {
  if (!data?.length) return [];
  return data.map((row) =>
    mapStorefrontProductRow(row as Record<string, unknown>),
  );
}

function mergeUnique(
  bucket: StorefrontProduct[],
  exclude: Set<string>,
  rows: StorefrontProduct[],
): void {
  for (const p of rows) {
    if (exclude.has(p.id)) continue;
    exclude.add(p.id);
    bucket.push(p);
    if (bucket.length >= MAX_SIMILAR) break;
  }
}

/**
 * Hasta 8 productos similares, por prioridad:
 * 1. Misma subcategoría
 * 2. Misma marca + tipo de producto (brand_type)
 * 3. Misma marca
 * 4. Rango de precio ±20 %
 */
export async function listSimilarStorefrontProducts(
  params: SimilarProductsParams,
): Promise<StorefrontProduct[]> {
  const supabase = await getCatalogSupabase();
  const out: StorefrontProduct[] = [];
  const exclude = new Set<string>([params.productId]);

  const need = () => MAX_SIMILAR - out.length;

  // 1. Subcategoría
  if (need() > 0 && params.subcategoryId) {
    const { data, error } = await supabase
      .from("products")
      .select(STOREFRONT_PRODUCT_SELECT)
      .eq("active", true)
      .eq("subcategory_id", params.subcategoryId)
      .order("name")
      .limit(32);

    if (!error && data?.length) {
      mergeUnique(out, exclude, mapRows(data as unknown[]));
    }
  }

  // 1b. Solo categoría (sin subcategoría en el producto actual)
  if (need() > 0 && params.categoriaId && !params.subcategoryId) {
    const { data, error } = await supabase
      .from("products")
      .select(STOREFRONT_PRODUCT_SELECT)
      .eq("active", true)
      .eq("category_id", params.categoriaId)
      .order("name")
      .limit(32);

    if (!error && data?.length) {
      mergeUnique(out, exclude, mapRows(data as unknown[]));
    }
  }

  // 2. Marca + tipo de producto
  if (need() > 0 && params.tipoProductoId && params.marcaId) {
    const { data, error } = await supabase
      .from("products")
      .select(STOREFRONT_PRODUCT_SELECT)
      .eq("active", true)
      .eq("brand_id", params.marcaId)
      .eq("brand_type_id", params.tipoProductoId)
      .order("name")
      .limit(32);

    if (!error && data?.length) {
      mergeUnique(out, exclude, mapRows(data as unknown[]));
    }
  }

  // 3. Misma marca
  if (need() > 0 && params.marcaId) {
    const { data, error } = await supabase
      .from("products")
      .select(STOREFRONT_PRODUCT_SELECT)
      .eq("active", true)
      .eq("brand_id", params.marcaId)
      .order("name")
      .limit(32);

    if (!error && data?.length) {
      mergeUnique(out, exclude, mapRows(data as unknown[]));
    }
  }

  // 4. Precio similar (±20 %)
  if (need() > 0 && Number.isFinite(params.precio) && params.precio > 0) {
    const lo = params.precio * (1 - PRICE_BAND);
    const hi = params.precio * (1 + PRICE_BAND);
    const { data, error } = await supabase
      .from("products")
      .select(STOREFRONT_PRODUCT_SELECT)
      .eq("active", true)
      .gte("price_client", lo)
      .lte("price_client", hi)
      .order("name")
      .limit(48);

    if (!error && data?.length) {
      mergeUnique(out, exclude, mapRows(data as unknown[]));
    }
  }

  return out.slice(0, MAX_SIMILAR);
}
