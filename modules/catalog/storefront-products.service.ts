import { getCatalogSupabase } from "@/lib/supabaseCatalogClient";
import { slugify } from "@/lib/slugify";
import type { StorefrontProduct } from "@/modules/catalog/storefront-product.shared";

type RelationRecord = {
  name?: unknown;
  slug?: unknown;
};

function relationSlug(
  rel: RelationRecord | RelationRecord[] | null | undefined,
  fallbackName: string,
): string {
  const row = Array.isArray(rel) ? rel[0] : rel;
  if (row && typeof row === "object") {
    const slugValue = row.slug;
    if (typeof slugValue === "string" && slugValue.trim() !== "") {
      return slugValue;
    }
    const nameValue = row.name;
    if (typeof nameValue === "string" && nameValue.trim() !== "") {
      return slugify(nameValue);
    }
  }
  return slugify(fallbackName);
}

/** Select de producto para tienda (reutilizable en otros módulos del catálogo). */
export const STOREFRONT_PRODUCT_SELECT = `
  id,
  sku,
  name,
  name_en,
  slug,
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
  brands ( name, name_en, slug ),
  categories ( id, name, name_en ),
  subcategories ( category_id, categories ( id, name, name_en ) ),
  brand_types ( name, name_en, slug ),
  product_characteristic_values (
    id,
    characteristic_specific_id,
    value,
    product_characteristics_specific (
      id,
      name,
      name_en,
      general_id,
      product_characteristics_general ( id, name, name_en )
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

function brandNamesFromProductRow(row: Record<string, unknown>): {
  name: string;
  nameEn: string | null;
} {
  const b = row.brands;
  const pick = (obj: { name?: unknown; name_en?: unknown } | null) => {
    if (!obj) return { name: "—", nameEn: null as string | null };
    const n = obj.name;
    const name =
      n != null && String(n).trim() !== "" ? String(n) : "—";
    const enRaw = obj.name_en;
    const nameEn =
      enRaw != null && String(enRaw).trim() !== ""
        ? String(enRaw)
        : null;
    return { name, nameEn };
  };
  if (b && typeof b === "object" && !Array.isArray(b) && "name" in b) {
    return pick(b as { name?: unknown; name_en?: unknown });
  }
  if (Array.isArray(b) && b[0] && typeof b[0] === "object" && "name" in b[0]) {
    return pick(b[0] as { name?: unknown; name_en?: unknown });
  }
  return { name: "—", nameEn: null };
}

function brandTypeNameFromProductRow(row: Record<string, unknown>): string {
  const t = row.brand_types;
  if (t && typeof t === "object" && !Array.isArray(t) && "name" in t) {
    const n = (t as { name?: unknown }).name;
    return n != null && String(n).trim() !== "" ? String(n) : "—";
  }
  if (Array.isArray(t) && t[0] && typeof t[0] === "object" && "name" in t[0]) {
    const n = (t[0] as { name?: unknown }).name;
    return n != null && String(n).trim() !== "" ? String(n) : "—";
  }
  return "—";
}

function categoryNameFromRelation(rel: unknown): {
  name: string | null;
  nameEn: string | null;
} {
  if (!rel || typeof rel !== "object") return { name: null, nameEn: null };
  if (!Array.isArray(rel) && "name" in rel) {
    const n = (rel as { name?: unknown; name_en?: unknown }).name;
    const en = (rel as { name_en?: unknown }).name_en;
    const name =
      n != null && String(n).trim() !== "" ? String(n) : null;
    const nameEn =
      en != null && String(en).trim() !== "" ? String(en) : null;
    return { name, nameEn };
  }
  if (Array.isArray(rel) && rel[0] && typeof rel[0] === "object" && "name" in rel[0]) {
    const n = (rel[0] as { name?: unknown; name_en?: unknown }).name;
    const en = (rel[0] as { name_en?: unknown }).name_en;
    const name =
      n != null && String(n).trim() !== "" ? String(n) : null;
    const nameEn =
      en != null && String(en).trim() !== "" ? String(en) : null;
    return { name, nameEn };
  }
  return { name: null, nameEn: null };
}

/** Categoría de listado: `category_id` directo o padre de `subcategory_id`. */
function effectiveCatalogCategory(
  row: Record<string, unknown>,
): {
  id: string | null;
  name: string | null;
  name_en: string | null;
} {
  const rawDirect = row.category_id;
  const hasDirect =
    rawDirect != null &&
    String(rawDirect).trim() !== "" &&
    String(rawDirect) !== "null";

  if (hasDirect) {
    const id = String(rawDirect);
    const { name, nameEn } = categoryNameFromRelation(row.categories);
    return { id, name: name ?? null, name_en: nameEn };
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
    const { name, nameEn } = categoryNameFromRelation(subObj.categories);
    return { id, name: name ?? null, name_en: nameEn };
  }

  return { id: null, name: null, name_en: null };
}

function normalizeCharacteristicsSpecific(raw: unknown): {
  id?: unknown;
  name?: unknown;
  name_en?: unknown;
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
      name_en?: unknown;
      general_id?: unknown;
      product_characteristics_general?: unknown;
    };
  }
  return raw as {
    id?: unknown;
    name?: unknown;
    name_en?: unknown;
    general_id?: unknown;
    product_characteristics_general?: unknown;
  };
}

function parseProductCharacteristicsFromRow(row: Record<string, unknown>): {
  characteristic_specifics: {
    id: string;
    name: string;
    name_en: string | null;
    general_id: string;
    general_name: string;
    general_name_en: string | null;
    value: string | null;
  }[];
} {
  const raw = row.product_characteristic_values;
  const byGeneral = new Map<string, { name: string; name_en: string | null }>();
  const bySpecific = new Map<
    string,
    {
      id: string;
      name: string;
      name_en: string | null;
      general_id: string;
      general_name: string;
      general_name_en: string | null;
      value: string | null;
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
    const specNameEnRaw = spec.name_en;
    const specNameEn =
      specNameEnRaw != null && String(specNameEnRaw).trim() !== ""
        ? String(specNameEnRaw)
        : null;

    const genRel = spec.product_characteristics_general;
    let genId: string | null = null;
    let genName: string | null = null;
    let genNameEn: string | null = null;
    if (genRel && typeof genRel === "object" && !Array.isArray(genRel)) {
      const gid = (genRel as { id?: unknown }).id;
      const gn = (genRel as { name?: unknown }).name;
      const gnEn = (genRel as { name_en?: unknown }).name_en;
      if (gid != null && String(gid).trim() !== "") {
        genId = String(gid);
        genName =
          gn != null && String(gn).trim() !== "" ? String(gn) : "—";
        genNameEn =
          gnEn != null && String(gnEn).trim() !== "" ? String(gnEn) : null;
      }
    }
    if (
      !genId &&
      spec.general_id != null &&
      String(spec.general_id).trim() !== ""
    ) {
      genId = String(spec.general_id);
      const catGen = categoryNameFromRelation(genRel);
      genName = catGen.name ?? "—";
      genNameEn = catGen.nameEn;
    }
    if (!genId) continue;

    if (!byGeneral.has(genId)) {
      byGeneral.set(genId, {
        name: genName ?? "—",
        name_en: genNameEn,
      });
    }
    const cached = byGeneral.get(genId)!;
    const gName = genName ?? cached.name ?? "—";
    const gNameEn =
      genName != null && genName !== ""
        ? genNameEn
        : cached.name_en;
    if (!bySpecific.has(specId)) {
      bySpecific.set(specId, {
        id: specId,
        name: specName,
        name_en: specNameEn,
        general_id: genId,
        general_name: gName,
        general_name_en: gNameEn,
          value:
            (cv as { value?: unknown }).value != null &&
            String((cv as { value?: unknown }).value).trim() !== ""
              ? String((cv as { value?: unknown }).value)
              : null,
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
  const brand = brandNamesFromProductRow(row);
  const brandTypeName = brandTypeNameFromProductRow(row);
  const brandSlug = relationSlug(
    row.brands as RelationRecord | RelationRecord[] | null | undefined,
    brand.name,
  );
  const brandTypeSlug = relationSlug(
    row.brand_types as RelationRecord | RelationRecord[] | null | undefined,
    brandTypeName !== "—" ? brandTypeName : brand.name,
  );
  const productSlug =
    typeof row.slug === "string" && row.slug.trim() !== ""
      ? row.slug
      : slugify(String(row.name ?? ""));
  const nameEnRaw = row.name_en;
  const name_en =
    nameEnRaw != null && String(nameEnRaw).trim() !== ""
      ? String(nameEnRaw)
      : null;
  return {
    id: String(row.id),
    sku: String(row.sku ?? ""),
    name: String(row.name),
    name_en,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
    price: Number(row.price),
    stock: Number(row.stock ?? 0),
    discount_business_pct: Number(row.discount_business_pct ?? 0),
    discount_client: Number(row.discount_client ?? 0),
    brand_id: String(row.brand_id),
    brand_type_id:
      row.brand_type_id != null ? String(row.brand_type_id) : null,
    brand_name: brand.name,
    brand_name_en: brand.nameEn,
    brand_slug: brandSlug,
    brand_type_slug: row.brand_type_id != null ? brandTypeSlug : null,
    slug: productSlug,
    ...(() => {
      const cat = effectiveCatalogCategory(row);
      return {
        category_id: cat.id,
        category_name: cat.name,
        category_name_en: cat.name_en,
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

function mapNameEnFromRow(row: Record<string, unknown>): string | null {
  const raw = row.name_en;
  if (raw == null || String(raw).trim() === "") return null;
  return String(raw);
}

export type StorefrontBrandRow = {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string;
};

export type StorefrontBrandTypeRow = {
  id: string;
  name: string;
  nameEn: string | null;
  brand_id: string;
  slug: string;
};

export async function getBrandById(
  brandId: string,
): Promise<StorefrontBrandRow | null> {
  const supabase = await getCatalogSupabase();
  let { data, error } = await supabase
    .from("brands")
    .select("id, name, name_en, slug, active")
    .eq("id", brandId)
    .maybeSingle();

  if (error && looksLikeMissingColumnError(error)) {
    const r = await supabase
      .from("brands")
      .select("id, name, slug, active")
      .eq("id", brandId)
      .maybeSingle();
    data = r.data as typeof data;
    error = r.error;
  }

  if (error && looksLikeMissingColumnError(error)) {
    const r2 = await supabase
      .from("brands")
      .select("id, name")
      .eq("id", brandId)
      .maybeSingle();
    data = r2.data as typeof data;
    error = r2.error;
  }

  if (error) {
    console.warn("[storefront] getBrandById", brandId, error.message);
    return null;
  }
  if (!data) return null;
  if ("active" in data && data.active === false) return null;
  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    name: row.name as string,
    nameEn: mapNameEnFromRow(row),
    slug: (row.slug as string | null | undefined) ?? slugify(String(row.name)),
  };
}

export async function getBrandBySlug(
  slug: string,
): Promise<StorefrontBrandRow | null> {
  const normalizedSlug = slugify(slug);
  const supabase = await getCatalogSupabase();
  let { data, error } = await supabase
    .from("brands")
    .select("id, name, name_en, slug, active")
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (error && looksLikeMissingColumnError(error)) {
    const r = await supabase
      .from("brands")
      .select("id, name, slug, active")
      .eq("slug", normalizedSlug)
      .maybeSingle();
    data = r.data as typeof data;
    error = r.error;
  }

  if (error) {
    console.warn("[storefront] getBrandBySlug", slug, error.message);
    return null;
  }
  if (!data) return null;
  if ("active" in data && data.active === false) return null;
  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    name: row.name as string,
    nameEn: mapNameEnFromRow(row),
    slug: (row.slug as string | null | undefined) ?? slugify(String(row.name)),
  };
}

/**
 * Tipo de marca por id (fuente de verdad del `brand_id`).
 * Evita 404 cuando la URL tiene el primer UUID mal pero el segundo (tipo) es válido.
 */
export async function getBrandTypeById(
  brandTypeId: string,
): Promise<StorefrontBrandTypeRow | null> {
  const supabase = await getCatalogSupabase();
  let { data, error } = await supabase
    .from("brand_types")
    .select("id, name, name_en, brand_id, slug, active")
    .eq("id", brandTypeId)
    .maybeSingle();

  if (error && looksLikeMissingColumnError(error)) {
    const r = await supabase
      .from("brand_types")
      .select("id, name, brand_id, slug, active")
      .eq("id", brandTypeId)
      .maybeSingle();
    data = r.data as typeof data;
    error = r.error;
  }

  if (error && looksLikeMissingColumnError(error)) {
    const r2 = await supabase
      .from("brand_types")
      .select("id, name, brand_id, slug")
      .eq("id", brandTypeId)
      .maybeSingle();
    data = r2.data as typeof data;
    error = r2.error;
  }

  if (error) {
    console.warn("[storefront] getBrandTypeById", brandTypeId, error.message);
    return null;
  }
  if (!data) return null;
  if ("active" in data && data.active === false) return null;
  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    name: row.name as string,
    nameEn: mapNameEnFromRow(row),
    brand_id: row.brand_id as string,
    slug: (row.slug as string | null | undefined) ?? slugify(String(row.name)),
  };
}

export async function getBrandTypeBySlug(
  brandId: string,
  slug: string,
): Promise<StorefrontBrandTypeRow | null> {
  const normalizedSlug = slugify(slug);
  const supabase = await getCatalogSupabase();
  let { data, error } = await supabase
    .from("brand_types")
    .select("id, name, name_en, brand_id, slug, active")
    .eq("brand_id", brandId)
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (error && looksLikeMissingColumnError(error)) {
    const r = await supabase
      .from("brand_types")
      .select("id, name, brand_id, slug, active")
      .eq("brand_id", brandId)
      .eq("slug", normalizedSlug)
      .maybeSingle();
    data = r.data as typeof data;
    error = r.error;
  }

  if (error) {
    console.warn(
      "[storefront] getBrandTypeBySlug",
      brandId,
      slug,
      error.message,
    );
    return null;
  }
  if (!data) return null;
  if ("active" in data && data.active === false) return null;
  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    name: row.name as string,
    nameEn: mapNameEnFromRow(row),
    brand_id: row.brand_id as string,
    slug: (row.slug as string | null | undefined) ?? slugify(String(row.name)),
  };
}

export async function listBrandTypesForBrand(
  brandId: string,
): Promise<{ id: string; name: string; nameEn: string | null; slug: string }[]> {
  const supabase = await getCatalogSupabase();
  let { data, error } = await supabase
    .from("brand_types")
    .select("id, name, name_en, slug, active")
    .eq("brand_id", brandId)
    .order("name");

  if (error && looksLikeMissingColumnError(error)) {
    const r = await supabase
      .from("brand_types")
      .select("id, name, slug, active")
      .eq("brand_id", brandId)
      .order("name");
    data = r.data as typeof data;
    error = r.error;
  }

  if (error && looksLikeMissingColumnError(error)) {
    const r2 = await supabase
      .from("brand_types")
      .select("id, name")
      .eq("brand_id", brandId)
      .order("name");
    data = r2.data as typeof data;
    error = r2.error;
  }

  if (error) {
    console.warn("[storefront] listBrandTypesForBrand", brandId, error.message);
    return [];
  }
  if (!data) return [];
  return data
    .filter((r) => !("active" in r) || r.active !== false)
    .map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: row.id as string,
        name: row.name as string,
        nameEn: mapNameEnFromRow(row),
        slug:
          typeof row.slug === "string" && row.slug.trim() !== ""
            ? row.slug
            : slugify(String(row.name)),
      };
    });
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

/**
 * Todos los productos activos marcados como destacados (`featured`).
 * Orden: actualización reciente primero.
 */
export async function listAllFeaturedStorefrontProducts(): Promise<
  StorefrontProduct[]
> {
  const supabase = await getCatalogSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .eq("featured", true)
    .order("updated_at", { ascending: false });

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
