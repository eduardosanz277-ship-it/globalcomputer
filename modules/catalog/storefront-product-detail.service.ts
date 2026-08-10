import { getCatalogSupabase } from "@/lib/supabaseCatalogClient";
import { slugify } from "@/lib/slugify";

export type StorefrontProductCharacteristicRow = {
  id: string;
  generalName: string;
  specificName: string;
  value: string | null;
};

export type StorefrontProductDetail = {
  id: string;
  sku: string;
  name: string;
  name_en: string | null;
  slug: string;
  description: string | null;
  /** HTML enriquecido (mismo tratamiento que `description`). */
  specifications: string | null;
  stock: number;
  price_client: number;
  price_business: number;
  discount_business_pct: number;
  discount_client_pct: number;
  shipping_type: "standard" | "non_standard";
  shipping_surcharge_per_unit: number;
  manual_pdf_url: string | null;
  brand_id: string;
  brand_type_id: string | null;
  brand_name: string;
  brand_name_en: string | null;
  brand_type_name: string;
  brand_type_name_en: string | null;
  brand_slug: string;
  brand_type_slug: string | null;
  /** Clasificación catálogo (para productos similares, SEO, etc.) */
  category_id: string | null;
  subcategory_id: string | null;
  created_at: string;
  updated_at: string;
  images: {
    id: string;
    url: string;
    is_primary: boolean;
    sort_order: number;
  }[];
  characteristics: StorefrontProductCharacteristicRow[];
};

type DetailRelation = {
  name?: unknown;
  name_en?: unknown;
  slug?: unknown;
};

function relationSlug(
  rel: DetailRelation | DetailRelation[] | null | undefined,
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

const DETAIL_SELECT = `
  id,
  sku,
  name,
  name_en,
  slug,
  description,
  specifications,
  stock,
  price_client,
  price_business,
  discount_business_pct,
  discount_client_pct,
  shipping_type,
  shipping_surcharge_per_unit,
  manual_pdf_url,
  brand_id,
  brand_type_id,
  category_id,
  subcategory_id,
  created_at,
  updated_at,
  brands ( name, name_en, slug ),
  brand_types ( name, name_en, slug ),
  product_images ( id, url, is_primary, sort_order ),
  product_characteristic_values (
    id,
    characteristic_specific_id,
    value,
    product_characteristics_specific (
      name,
      product_characteristics_general ( name )
    )
  )
`;

function relationName(
  rel: { name?: string } | { name?: string }[] | null | undefined,
): string {
  if (!rel) return "—";
  if (Array.isArray(rel)) return rel[0]?.name ?? "—";
  return rel.name ?? "—";
}

function relationNameEn(
  rel:
    | { name_en?: string | null }
    | { name_en?: string | null }[]
    | null
    | undefined,
): string | null {
  if (!rel) return null;
  const row = Array.isArray(rel) ? rel[0] : rel;
  const value = row?.name_en;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed !== "" ? trimmed : null;
}

function optionalText(value: unknown): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed !== "" ? trimmed : null;
}

function specificRelation(
  rel:
    | {
      name: string;
      product_characteristics_general:
      | { name: string }
      | { name: string }[]
      | null;
    }
    | {
      name: string;
      product_characteristics_general:
      | { name: string }
      | { name: string }[]
      | null;
    }[]
    | null
    | undefined,
) {
  if (!rel) return null;
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel;
}

function mapDetailRow(row: Record<string, unknown>): StorefrontProductDetail {
  const rawImages = row.product_images as
    | StorefrontProductDetail["images"]
    | null
    | undefined;
  const images = (rawImages ?? [])
    .slice()
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });

  const rawCv = row.product_characteristic_values as
    | Array<{
      id: string;
      characteristic_specific_id: string;
      value: string | null;
      product_characteristics_specific: unknown;
    }>
    | null
    | undefined;

  const characteristics: StorefrontProductCharacteristicRow[] = (
    rawCv ?? []
  )
    .map((cv) => {
      const specific = specificRelation(
        cv.product_characteristics_specific as
        | {
          name: string;
          product_characteristics_general:
          | { name: string }
          | { name: string }[]
          | null;
        }
        | {
          name: string;
          product_characteristics_general:
          | { name: string }
          | { name: string }[]
          | null;
        }[]
        | null
        | undefined,
      );
      const generalName = relationName(
        specific?.product_characteristics_general ?? null,
      );
      return {
        id: cv.id,
        generalName,
        specificName: specific?.name ?? "—",
        value: cv.value,
      };
    })
    .sort((a, b) => {
      const byG = a.generalName.localeCompare(b.generalName, "es");
      if (byG !== 0) return byG;
      return a.specificName.localeCompare(b.specificName, "es");
    });

  const brandName = relationName(row.brands as Parameters<typeof relationName>[0]);
  const brandNameEn = relationNameEn(
    row.brands as Parameters<typeof relationNameEn>[0],
  );
  const brandTypeName = relationName(
    row.brand_types as Parameters<typeof relationName>[0],
  );
  const brandTypeNameEn = relationNameEn(
    row.brand_types as Parameters<typeof relationNameEn>[0],
  );
  const brandSlug = relationSlug(
    row.brands as DetailRelation | DetailRelation[] | null | undefined,
    brandName,
  );
  const brandTypeSlug = relationSlug(
    row.brand_types as DetailRelation | DetailRelation[] | null | undefined,
    brandTypeName,
  );
  const productSlug =
    typeof row.slug === "string" && row.slug.trim() !== ""
      ? row.slug
      : slugify(String(row.name ?? ""));

  return {
    id: String(row.id),
    sku: String(row.sku),
    name: String(row.name),
    name_en: optionalText(row.name_en),
    slug: productSlug,
    description:
      row.description != null && String(row.description).trim() !== ""
        ? String(row.description)
        : null,
    specifications:
      row.specifications != null && String(row.specifications).trim() !== ""
        ? String(row.specifications)
        : null,
    stock: Number(row.stock ?? 0),
    price_client: Number(row.price_client ?? 0),
    price_business: Number(row.price_business ?? 0),
    discount_business_pct: Number(row.discount_business_pct ?? 0),
    discount_client_pct: Number(row.discount_client_pct ?? 0),
    shipping_type:
      row.shipping_type === "non_standard" ? "non_standard" : "standard",
    shipping_surcharge_per_unit: Number(row.shipping_surcharge_per_unit ?? 0),
    manual_pdf_url:
      row.manual_pdf_url != null && String(row.manual_pdf_url).trim() !== ""
        ? String(row.manual_pdf_url)
        : null,
    brand_id: String(row.brand_id),
    brand_type_id:
      row.brand_type_id != null ? String(row.brand_type_id) : null,
    brand_name: brandName,
    brand_name_en: brandNameEn,
    brand_type_name: brandTypeName,
    brand_type_name_en: brandTypeNameEn,
    brand_slug: brandSlug,
    brand_type_slug:
      row.brand_type_id != null ? brandTypeSlug : null,
    category_id:
      row.category_id != null && String(row.category_id).trim() !== ""
        ? String(row.category_id)
        : null,
    subcategory_id:
      row.subcategory_id != null && String(row.subcategory_id).trim() !== ""
        ? String(row.subcategory_id)
        : null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
    images,
    characteristics,
  };
}

export async function getStorefrontProductDetailById(
  id: string,
): Promise<StorefrontProductDetail | null> {
  const supabase = await getCatalogSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(DETAIL_SELECT)
    .eq("id", id)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    console.warn("[storefront] getStorefrontProductDetailById", id, error.message);
    return null;
  }
  if (!data) return null;
  return mapDetailRow(data as Record<string, unknown>);
}

export async function getStorefrontProductDetailBySlug(
  slug: string,
): Promise<StorefrontProductDetail | null> {
  const normalizedSlug = slugify(slug);
  const supabase = await getCatalogSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(DETAIL_SELECT)
    .eq("slug", normalizedSlug)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    console.warn("[storefront] getStorefrontProductDetailBySlug", slug, error.message);
    return null;
  }
  if (!data) return null;
  return mapDetailRow(data as Record<string, unknown>);
}
