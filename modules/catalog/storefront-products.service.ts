import { getCatalogSupabase } from "@/lib/supabaseCatalogClient";

/** Select de producto para tienda (reutilizable en otros módulos del catálogo). */
export const STOREFRONT_PRODUCT_SELECT = `
  id,
  name,
  description,
  price,
  sku,
  brand_id,
  brand_type_id,
  product_images ( id, url, is_primary, sort_order )
`;

const PRODUCT_SELECT = STOREFRONT_PRODUCT_SELECT;

export type StorefrontProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sku: string;
  brand_id: string;
  brand_type_id: string | null;
  product_images: {
    id: string;
    url: string;
    is_primary: boolean;
    sort_order: number;
  }[];
};

function mapProductImages(
  raw: StorefrontProduct["product_images"] | null | undefined,
): StorefrontProduct["product_images"] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw;
}

export function mapStorefrontProductRow(row: Record<string, unknown>): StorefrontProduct {
  return {
    id: String(row.id),
    name: String(row.name),
    description: row.description != null ? String(row.description) : null,
    price: Number(row.price),
    sku: String(row.sku),
    brand_id: String(row.brand_id),
    brand_type_id:
      row.brand_type_id != null ? String(row.brand_type_id) : null,
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

export function storefrontPrimaryImageUrl(product: StorefrontProduct): string | null {
  const imgs = product.product_images.slice().sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
  const primary = imgs.find((i) => i.is_primary) ?? imgs[0];
  return primary?.url ?? null;
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
