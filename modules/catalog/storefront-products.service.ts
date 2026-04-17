import { getCatalogSupabase } from "@/lib/supabaseCatalogClient";
import type { StorefrontProduct } from "@/modules/catalog/storefront-product.shared";

/** Select de producto para tienda (reutilizable en otros módulos del catálogo). */
export const STOREFRONT_PRODUCT_SELECT = `
  id,
  name,
  created_at,
  updated_at,
  price,
  stock,
  discount_business_pct,
  discount_client,
  brand_id,
  brand_type_id,
  category_id,
  subcategory_id,
  brands ( name ),
  categories ( id, name ),
  subcategories ( category_id, categories ( id, name ) ),
  product_characteristic_values (
    id,
    characteristic_specific_id,
    value,
    product_characteristics_specific (
      id,
      name,
      general_id,
      product_characteristics_general ( id, name )
    )
  ),
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

function categoryNameFromRelation(rel: unknown): string | null {
  if (!rel || typeof rel !== "object") return null;
  if (!Array.isArray(rel) && "name" in rel) {
    const n = (rel as { name?: unknown }).name;
    if (n != null && String(n).trim() !== "") return String(n);
  }
  if (Array.isArray(rel) && rel[0] && typeof rel[0] === "object" && "name" in rel[0]) {
    const n = (rel[0] as { name?: unknown }).name;
    if (n != null && String(n).trim() !== "") return String(n);
  }
  return null;
}

/** Categoría de listado: `category_id` directo o padre de `subcategory_id`. */
function effectiveCatalogCategory(
  row: Record<string, unknown>,
): { id: string | null; name: string | null } {
  const rawDirect = row.category_id;
  const hasDirect =
    rawDirect != null &&
    String(rawDirect).trim() !== "" &&
    String(rawDirect) !== "null";

  if (hasDirect) {
    const id = String(rawDirect);
    const name = categoryNameFromRelation(row.categories);
    return { id, name: name ?? null };
  }

  const sub = row.subcategories;
  let subObj: { category_id?: unknown; categories?: unknown } | null = null;
  if (sub && typeof sub === "object") {
    if (Array.isArray(sub) && sub[0] && typeof sub[0] === "object") {
      subObj = sub[0] as { category_id?: unknown; categories?: unknown };
    } else if (!Array.isArray(sub)) {
      subObj = sub as { category_id?: unknown; categories?: unknown };
    }
  }
  if (
    subObj?.category_id != null &&
    String(subObj.category_id).trim() !== "" &&
    String(subObj.category_id) !== "null"
  ) {
    const id = String(subObj.category_id);
    const name = categoryNameFromRelation(subObj.categories);
    return { id, name: name ?? null };
  }

  return { id: null, name: null };
}

function normalizeCharacteristicsSpecific(raw: unknown): {
  id?: unknown;
  name?: unknown;
  general_id?: unknown;
  product_characteristics_general?: unknown;
} | null {
  if (!raw || typeof raw !== "object") return null;
  if (Array.isArray(raw)) {
    const first = raw[0];
    if (!first || typeof first !== "object") return null;
    return first as {
      id?: unknown;
      name?: unknown;
      general_id?: unknown;
      product_characteristics_general?: unknown;
    };
  }
  return raw as {
    id?: unknown;
    name?: unknown;
    general_id?: unknown;
    product_characteristics_general?: unknown;
  };
}

function parseProductCharacteristicsFromRow(row: Record<string, unknown>): {
  characteristic_specifics: {
    id: string;
    name: string;
    general_id: string;
    general_name: string;
  }[];
} {
  const raw = row.product_characteristic_values;
  const byGeneral = new Map<string, string>();
  const bySpecific = new Map<
    string,
    {
      id: string;
      name: string;
      general_id: string;
      general_name: string;
    }
  >();

  if (!raw || !Array.isArray(raw)) {
    return { characteristic_specifics: [] };
  }

  for (const cv of raw) {
    if (!cv || typeof cv !== "object") continue;
    const spec = normalizeCharacteristicsSpecific(
      (cv as { product_characteristics_specific?: unknown })
        .product_characteristics_specific,
    );
    if (!spec) continue;

    const specIdRaw =
      (cv as { characteristic_specific_id?: unknown })
        .characteristic_specific_id ?? spec.id;
    if (specIdRaw == null || String(specIdRaw).trim() === "") continue;
    const specId = String(specIdRaw);

    const specNameRaw = spec.name;
    const specName =
      specNameRaw != null && String(specNameRaw).trim() !== ""
        ? String(specNameRaw)
        : "—";

    const genRel = spec.product_characteristics_general;
    let genId: string | null = null;
    let genName: string | null = null;
    if (genRel && typeof genRel === "object" && !Array.isArray(genRel)) {
      const gid = (genRel as { id?: unknown }).id;
      const gn = (genRel as { name?: unknown }).name;
      if (gid != null && String(gid).trim() !== "") {
        genId = String(gid);
        genName =
          gn != null && String(gn).trim() !== "" ? String(gn) : "—";
      }
    }
    if (
      !genId &&
      spec.general_id != null &&
      String(spec.general_id).trim() !== ""
    ) {
      genId = String(spec.general_id);
      genName = categoryNameFromRelation(genRel) ?? "—";
    }
    if (!genId) continue;

    if (!byGeneral.has(genId)) {
      byGeneral.set(genId, genName ?? "—");
    }
    const gName = genName ?? byGeneral.get(genId) ?? "—";
    if (!bySpecific.has(specId)) {
      bySpecific.set(specId, {
        id: specId,
        name: specName,
        general_id: genId,
        general_name: gName,
      });
    }
  }

  return {
    characteristic_specifics: Array.from(bySpecific.values()),
  };
}

export function mapStorefrontProductRow(
  row: Record<string, unknown>,
): StorefrontProduct {
  const chars = parseProductCharacteristicsFromRow(row);
  return {
    id: String(row.id),
    name: String(row.name),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
    price: Number(row.price),
    stock: Number(row.stock ?? 0),
    discount_business_pct: Number(row.discount_business_pct ?? 0),
    discount_client: Number(row.discount_client ?? 0),
    brand_id: String(row.brand_id),
    brand_type_id:
      row.brand_type_id != null ? String(row.brand_type_id) : null,
    brand_name: brandNameFromProductRow(row),
    ...(() => {
      const cat = effectiveCatalogCategory(row);
      return {
        category_id: cat.id,
        category_name: cat.name,
      };
    })(),
    characteristic_specifics: chars.characteristic_specifics,
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

/**
 * Productos activos marcados como destacados (`featured`), para bloques como el home.
 * Orden: actualización reciente primero.
 */
export async function listFeaturedStorefrontProducts(
  limit: number,
): Promise<StorefrontProduct[]> {
  const cap = Math.min(Math.max(1, Math.floor(limit)), 8);
  const supabase = await getCatalogSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .eq("featured", true)
    .order("updated_at", { ascending: false })
    .limit(cap);

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

/**
 * Productos clasificados en la categoría: `category_id` directo o `subcategory_id`
 * cuya subcategoría pertenece a esta categoría (exclusivo XOR en DB).
 */
export async function listProductsByCategoryId(
  categoryId: string,
): Promise<StorefrontProduct[]> {
  const supabase = await getCatalogSupabase();
  const { data: subs, error: subErr } = await supabase
    .from("subcategories")
    .select("id")
    .eq("category_id", categoryId)
    .is("deleted_at", null);

  if (subErr) {
    console.warn(
      "[storefront] listProductsByCategoryId subcategories",
      subErr.message,
    );
  }

  const subIds = (subs ?? []).map((s) => s.id as string);

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true);

  if (subIds.length > 0) {
    const inList = subIds.join(",");
    query = query.or(
      `category_id.eq.${categoryId},subcategory_id.in.(${inList})`,
    );
  } else {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query.order("name");

  if (error || !data) {
    if (error) {
      console.warn(
        "[storefront] listProductsByCategoryId",
        categoryId,
        error.message,
      );
    }
    return [];
  }
  return data.map((row) => mapStorefrontProductRow(row as Record<string, unknown>));
}

export async function listProductsBySubcategoryId(
  subcategoryId: string,
): Promise<StorefrontProduct[]> {
  const supabase = await getCatalogSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("subcategory_id", subcategoryId)
    .eq("active", true)
    .order("name");

  if (error || !data) return [];
  return data.map((row) => mapStorefrontProductRow(row as Record<string, unknown>));
}

/** Productos de vitrina por ids (p. ej. carrito). Omite ids inexistentes o inactivos. */
export async function getStorefrontProductsByIds(
  ids: string[],
): Promise<StorefrontProduct[]> {
  const unique = [...new Set(ids.filter((id) => id && id.trim() !== ""))];
  if (unique.length === 0) return [];
  const supabase = await getCatalogSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .in("id", unique)
    .eq("active", true);

  if (error || !data) return [];
  return data.map((row) => mapStorefrontProductRow(row as Record<string, unknown>));
}
