import { getCatalogSupabase } from "@/lib/supabaseCatalogClient";
import type { StorefrontProduct } from "@/modules/catalog/storefront-product.shared";

/** Select de producto para tienda (reutilizable en otros módulos del catálogo). */
export const STOREFRONT_PRODUCT_SELECT = `
  id,
  name,
  updated_at,
  price,
  stock,
  discount_business_pct,
  discount_client,
  brand_id,
  brand_type_id,
  brands ( name ),
  product_images ( id, url, is_primary, sort_order )
`;

const PRODUCT_SELECT = STOREFRONT_PRODUCT_SELECT;

export type { StorefrontProduct } from "@/modules/catalog/storefront-product.shared";
export { storefrontPrimaryImageUrl } from "@/modules/catalog/storefront-product.shared";

function mapProductImages(
  raw: StorefrontProduct["product_images"] | null | undefined,
): StorefrontProduct["product_images"] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw;
}

function brandNameFromProductRow(row: Record<string, unknown>): string {
  const b = row.brands;
  if (b && typeof b === "object" && !Array.isArray(b) && "name" in b) {
    const n = (b as { name?: unknown }).name;
    return n != null && String(n).trim() !== "" ? String(n) : "—";
  }
  if (Array.isArray(b) && b[0] && typeof b[0] === "object" && "name" in b[0]) {
    const n = (b[0] as { name?: unknown }).name;
    return n != null && String(n).trim() !== "" ? String(n) : "—";
  }
  return "—";
}

export function mapStorefrontProductRow(
  row: Record<string, unknown>,
): StorefrontProduct {
  return {
    id: String(row.id),
    name: String(row.name),
    updated_at: String(row.updated_at ?? ""),
    price: Number(row.price),
    stock: Number(row.stock ?? 0),
    discount_business_pct: Number(row.discount_business_pct ?? 0),
    discount_client: Number(row.discount_client ?? 0),
    brand_id: String(row.brand_id),
    brand_type_id:
      row.brand_type_id != null ? String(row.brand_type_id) : null,
    brand_name: brandNameFromProductRow(row),
    product_images: mapProductImages(
      row.product_images as StorefrontProduct["product_images"],
    ),
  };
}

function looksLikeMissingColumnError(error: { message?: string } | null): boolean {
  const m = error?.message ?? "";
  return (
    m.includes("column") ||
    m.includes("schema cache") ||
    m.includes("Could not find") ||
    m.includes("does not exist")
  );
}

export async function getBrandById(
  brandId: string,
): Promise<{ id: string; name: string } | null> {
  const supabase = await getCatalogSupabase();
  let { data, error } = await supabase
    .from("brands")
    .select("id, name, active")
    .eq("id", brandId)
    .maybeSingle();

  if (error && looksLikeMissingColumnError(error)) {
    const r = await supabase
      .from("brands")
      .select("id, name")
      .eq("id", brandId)
      .maybeSingle();
    data = r.data as typeof data;
    error = r.error;
  }

  if (error) {
    console.warn("[storefront] getBrandById", brandId, error.message);
    return null;
  }
  if (!data) return null;
  if ("active" in data && data.active === false) return null;
  return { id: data.id, name: data.name };
}

/**
 * Tipo de marca por id (fuente de verdad del `brand_id`).
 * Evita 404 cuando la URL tiene el primer UUID mal pero el segundo (tipo) es válido.
 */
export async function getBrandTypeById(
  brandTypeId: string,
): Promise<{ id: string; name: string; brand_id: string } | null> {
  const supabase = await getCatalogSupabase();
  let { data, error } = await supabase
    .from("brand_types")
    .select("id, name, brand_id, active")
    .eq("id", brandTypeId)
    .maybeSingle();

  if (error && looksLikeMissingColumnError(error)) {
    const r = await supabase
      .from("brand_types")
      .select("id, name, brand_id")
      .eq("id", brandTypeId)
      .maybeSingle();
    data = r.data as typeof data;
    error = r.error;
  }

  if (error) {
    console.warn("[storefront] getBrandTypeById", brandTypeId, error.message);
    return null;
  }
  if (!data) return null;
  if ("active" in data && data.active === false) return null;
  return {
    id: data.id,
    name: data.name,
    brand_id: data.brand_id,
  };
}

export async function listBrandTypesForBrand(
  brandId: string,
): Promise<{ id: string; name: string }[]> {
  const supabase = await getCatalogSupabase();
  let { data, error } = await supabase
    .from("brand_types")
    .select("id, name, active")
    .eq("brand_id", brandId)
    .order("name");

  if (error && looksLikeMissingColumnError(error)) {
    const r = await supabase
      .from("brand_types")
      .select("id, name")
      .eq("brand_id", brandId)
      .order("name");
    data = r.data as typeof data;
    error = r.error;
  }

  if (error) {
    console.warn("[storefront] listBrandTypesForBrand", brandId, error.message);
    return [];
  }
  if (!data) return [];
  return data
    .filter((r) => !("active" in r) || r.active !== false)
    .map((r) => ({ id: r.id, name: r.name }));
}

/** Todos los productos activos del catálogo público (tienda). */
export async function listAllActiveStorefrontProducts(): Promise<
  StorefrontProduct[]
> {
  const supabase = await getCatalogSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .order("name");

  if (error || !data) return [];
  return data.map((row) => mapStorefrontProductRow(row as Record<string, unknown>));
}

export async function listProductsByBrandId(
  brandId: string,
): Promise<StorefrontProduct[]> {
  const supabase = await getCatalogSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("brand_id", brandId)
    .eq("active", true)
    .order("name");

  if (error || !data) return [];
  return data.map((row) => mapStorefrontProductRow(row as Record<string, unknown>));
}

export async function listProductsByBrandAndType(
  brandId: string,
  brandTypeId: string,
): Promise<StorefrontProduct[]> {
  const supabase = await getCatalogSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("brand_id", brandId)
    .eq("brand_type_id", brandTypeId)
    .eq("active", true)
    .order("name");

  if (error || !data) return [];
  return data.map((row) => mapStorefrontProductRow(row as Record<string, unknown>));
}
