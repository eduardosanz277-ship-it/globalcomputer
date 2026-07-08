import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type {
  ExistingProductImageOutput,
  Product,
  ProductCharacteristicValueInput,
  ProductImage,
  ProductInsert,
  ProductUpdate,
} from "./products.types";

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  specifications: string | null;
  specifications_en: string | null;
  stock: number;
  pricing_strategy: string;
  cost: number;
  margin_client_pct: number;
  margin_business_pct: number;
  price_client: number;
  price_business: number;
  active: boolean;
  featured: boolean;
  discount_business_pct: number;
  discount_client_pct: number;
  manual_pdf_url: string | null;
  brand_id: string;
  brand_type_id: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  created_at: string;
  updated_at: string;
  brands: { name: string; name_en?: string | null } | { name: string; name_en?: string | null }[] | null;
  brand_types:
    | { name: string; name_en?: string | null }
    | { name: string; name_en?: string | null }[]
    | null;
  categories:
    | { name: string; name_en?: string | null }
    | { name: string; name_en?: string | null }[]
    | null;
  subcategories:
    | {
        name: string;
        name_en?: string | null;
        category_id: string;
        categories:
          | { name: string; name_en?: string | null }
          | { name: string; name_en?: string | null }[]
          | null;
      }
    | Array<{
        name: string;
        name_en?: string | null;
        category_id: string;
        categories:
          | { name: string; name_en?: string | null }
          | { name: string; name_en?: string | null }[]
          | null;
      }>
    | null;
  product_images?: Array<{ id: string; url: string; is_primary: boolean }>;
  product_characteristic_values?: Array<{
    id: string;
    characteristic_specific_id: string;
    value: string | null;
    product_characteristics_specific:
      | {
          name: string;
          name_en?: string | null;
          product_characteristics_general:
            | { name: string; name_en?: string | null }
            | { name: string; name_en?: string | null }[]
            | null;
        }
      | {
          name: string;
          name_en?: string | null;
          product_characteristics_general:
            | { name: string; name_en?: string | null }
            | { name: string; name_en?: string | null }[]
            | null;
        }[]
      | null;
  }>;
  slug: string;
};

function relationField<TField extends "name" | "name_en">(
  rel:
    | { name?: string; name_en?: string | null }
    | { name?: string; name_en?: string | null }[]
    | null
    | undefined,
  field: TField,
): string | null {
  if (!rel) return null;
  if (Array.isArray(rel)) return (rel[0]?.[field] as string | null | undefined) ?? null;
  return (rel[field] as string | null | undefined) ?? null;
}

function relationName(
  rel:
    | { name?: string; name_en?: string | null }
    | { name?: string; name_en?: string | null }[]
    | null
    | undefined,
): string {
  return relationField(rel, "name") ?? "—";
}

function relationNameEn(
  rel:
    | { name?: string; name_en?: string | null }
    | { name?: string; name_en?: string | null }[]
    | null
    | undefined,
): string | null {
  return relationField(rel, "name_en");
}

function specificRelation(
  rel:
    | {
        name: string;
        name_en?: string | null;
        product_characteristics_general:
          | { name: string; name_en?: string | null }
          | { name: string; name_en?: string | null }[]
          | null;
      }
    | {
        name: string;
        name_en?: string | null;
        product_characteristics_general:
          | { name: string; name_en?: string | null }
          | { name: string; name_en?: string | null }[]
          | null;
      }[]
    | null
    | undefined,
) {
  if (!rel) return null;
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel;
}

function subcategoryRelation(
  rel:
    | ProductRow["subcategories"]
    | {
        name: string;
        name_en?: string | null;
        category_id: string;
        categories:
          | { name: string; name_en?: string | null }
          | { name: string; name_en?: string | null }[]
          | null;
      }
    | null
    | undefined,
):
  | {
      name: string;
      name_en?: string | null;
      category_id: string;
      categories:
        | { name: string; name_en?: string | null }
        | { name: string; name_en?: string | null }[]
        | null;
    }
  | null {
  if (!rel) return null;
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel;
}

function catalogPlacementFromRow(row: ProductRow): Pick<
  Product,
  | "categoryId"
  | "subcategoryId"
  | "catalogLabel"
  | "catalogLabelEn"
  | "placementCategoryId"
  | "placementSubcategoryId"
> {
  const catName = relationName(row.categories);
  const catNameEn = relationNameEn(row.categories);
  const sub = subcategoryRelation(row.subcategories);

  if (row.subcategory_id && sub) {
    const parentName = relationName(sub.categories ?? null);
    const parentNameEn = relationNameEn(sub.categories ?? null);
    const subName = sub.name ?? "—";
    const subNameEn = sub.name_en ?? null;
    return {
      categoryId: null,
      subcategoryId: row.subcategory_id,
      catalogLabel:
        parentName && subName ? `${parentName} › ${subName}` : subName,
      catalogLabelEn:
        (parentNameEn && (subNameEn ?? subName)
          ? `${parentNameEn} › ${subNameEn ?? subName}`
          : (subNameEn ?? subName)) ?? "—",
      placementCategoryId: sub.category_id ?? "",
      placementSubcategoryId: row.subcategory_id,
    };
  }

  if (row.category_id && catName) {
    return {
      categoryId: row.category_id,
      subcategoryId: null,
      catalogLabel: catName,
      catalogLabelEn: catNameEn ?? catName,
      placementCategoryId: row.category_id,
      placementSubcategoryId: "",
    };
  }

  return {
    categoryId: null,
    subcategoryId: null,
    catalogLabel: "—",
    catalogLabelEn: "—",
    placementCategoryId: "",
    placementSubcategoryId: "",
  };
}

function mapRow(row: ProductRow): Product {
  const placement = catalogPlacementFromRow(row);
  const images: ProductImage[] =
    row.product_images
      ?.slice()
      .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
      .map((img, index) => ({
        id: img.id,
        url: img.url,
        isPrimary: img.is_primary,
        order: index,
      })) ?? [];

  const primaryImage = images.find((img) => img.isPrimary) ?? images[0];

  const characteristicValues =
    row.product_characteristic_values
      ?.map((cv) => {
        const specific = specificRelation(cv.product_characteristics_specific);
        const generalName = relationName(
          specific?.product_characteristics_general ?? null,
        );
        const generalNameEn = Array.isArray(
          specific?.product_characteristics_general,
        )
          ? (specific?.product_characteristics_general[0]?.name_en ?? null)
          : (specific?.product_characteristics_general?.name_en ?? null);
        return {
          id: cv.id,
          specificId: cv.characteristic_specific_id,
          specificName: specific?.name ?? "—",
          specificNameEn: specific?.name_en ?? null,
          generalName,
          generalNameEn,
          value: cv.value,
        };
      })
      .sort((a, b) => {
        const byGeneral = a.generalName.localeCompare(b.generalName, "es");
        if (byGeneral !== 0) return byGeneral;
        return a.specificName.localeCompare(b.specificName, "es");
      }) ?? [];

  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    nameEn: row.name_en,
    description: row.description,
    descriptionEn: row.description_en,
    specifications: row.specifications,
    specificationsEn: row.specifications_en,
    stock: row.stock,
    pricingStrategy: row.pricing_strategy as Product["pricingStrategy"],
    cost: row.cost,
    marginClientPct: row.margin_client_pct,
    marginBusinessPct: row.margin_business_pct,
    priceClient: row.price_client,
    priceBusiness: row.price_business,
    active: row.active,
    featured: row.featured,
    discountBusinessPct: row.discount_business_pct,
    discountClientPct: row.discount_client_pct,
    manualPdfUrl: row.manual_pdf_url,
    brandId: row.brand_id,
    brandName: relationName(row.brands),
    brandNameEn: relationNameEn(row.brands),
    brandTypeId: row.brand_type_id ?? "",
    brandTypeName: relationName(row.brand_types),
    brandTypeNameEn: relationNameEn(row.brand_types),
    ...placement,
    imageUrl: primaryImage?.url ?? null,
    images,
    characteristicValues,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    slug: row.slug,
  };
}

const PRODUCT_SELECT =
  "id, sku, slug, name, name_en, description, description_en, specifications, specifications_en, stock, pricing_strategy, cost, margin_client_pct, margin_business_pct, price_client, price_business, active, featured, discount_business_pct, discount_client_pct, manual_pdf_url, brand_id, brand_type_id, category_id, subcategory_id, created_at, updated_at, brands(name, name_en), brand_types(name, name_en), categories(name, name_en), subcategories(name, name_en, category_id, categories(name, name_en)), product_images(id, url, is_primary), product_characteristic_values(id, characteristic_specific_id, value, product_characteristics_specific(name, name_en, product_characteristics_general(name, name_en)))";

function placementToDbColumns(payload: ProductInsert): {
  category_id: string | null;
  subcategory_id: string | null;
} {
  const sub = payload.placementSubcategoryId?.trim();
  if (sub) {
    return { category_id: null, subcategory_id: sub };
  }
  return { category_id: payload.placementCategoryId, subcategory_id: null };
}

export async function repoListProducts(): Promise<Product[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as ProductRow[]).map(mapRow);
}

export async function repoGetProductStockSnapshot(id: string): Promise<{
  id: string;
  name: string;
  sku: string;
  stock: number;
} | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, sku, stock")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as {
    id: string;
    name: string;
    sku: string;
    stock: number;
  };
  return row;
}

export async function repoGetLastLowStockAlertAt(
  productId: string,
): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("low_stock_alert_logs")
    .select("last_sent_at")
    .eq("product_id", productId)
    .maybeSingle();

  if (error) throw error;
  return (data as { last_sent_at?: string | null } | null)?.last_sent_at ?? null;
}

export async function repoUpsertLowStockAlertAt(
  productId: string,
  sentAtIso: string,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("low_stock_alert_logs").upsert(
    {
      product_id: productId,
      last_sent_at: sentAtIso,
    },
    { onConflict: "product_id" },
  );

  if (error) throw error;
}

export async function repoCreateProduct(payload: ProductInsert): Promise<Product> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      sku: payload.sku,
      slug: payload.slug,
      name: payload.name,
      name_en: payload.nameEn || null,
      description: payload.description || null,
      description_en: payload.descriptionEn || null,
      specifications: payload.specifications || null,
      specifications_en: payload.specificationsEn || null,
      stock: payload.stock,
      pricing_strategy: payload.pricingStrategy,
      cost: payload.cost,
      margin_client_pct: payload.marginClientPct,
      margin_business_pct: payload.marginBusinessPct,
      price_client: payload.priceClient,
      price_business: payload.priceBusiness,
      active: payload.active,
      featured: payload.featured,
      discount_business_pct: payload.discountBusinessPct,
      discount_client_pct: payload.discountClientPct,
      manual_pdf_url: payload.manualPdfUrl || null,
      brand_id: payload.brandId,
      brand_type_id: payload.brandTypeId || null,
      ...placementToDbColumns(payload),
    })
    .select(PRODUCT_SELECT)
    .single();

  if (error) throw error;
  return mapRow(data as ProductRow);
}

export async function repoUpdateProduct(
  id: string,
  payload: ProductUpdate,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("products")
    .update({
      slug: payload.slug,
      sku: payload.sku,
      name: payload.name,
      name_en: payload.nameEn || null,
      description: payload.description || null,
      description_en: payload.descriptionEn || null,
      specifications: payload.specifications || null,
      specifications_en: payload.specificationsEn || null,
      stock: payload.stock,
      pricing_strategy: payload.pricingStrategy,
      cost: payload.cost,
      margin_client_pct: payload.marginClientPct,
      margin_business_pct: payload.marginBusinessPct,
      price_client: payload.priceClient,
      price_business: payload.priceBusiness,
      active: payload.active,
      featured: payload.featured,
      discount_business_pct: payload.discountBusinessPct,
      discount_client_pct: payload.discountClientPct,
      manual_pdf_url: payload.manualPdfUrl || null,
      brand_id: payload.brandId,
      brand_type_id: payload.brandTypeId || null,
      ...placementToDbColumns(payload),
    })
    .eq("id", id);

  if (error) throw error;
}

export async function repoUpdateProductManualPdfUrl(
  id: string,
  manualPdfUrl: string | null,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("products")
    .update({ manual_pdf_url: manualPdfUrl })
    .eq("id", id);
  if (error) throw error;
}

export async function repoDeleteProduct(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function repoInsertProductImages(
  payload: Array<{ productId: string; url: string; isPrimary: boolean }>,
): Promise<void> {
  if (payload.length === 0) return;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("product_images").insert(
    payload.map((item) => ({
      product_id: item.productId,
      url: item.url,
      is_primary: item.isPrimary,
    })),
  );
  if (error) throw error;
}

export async function repoUnsetPrimaryProductImage(productId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", productId)
    .eq("is_primary", true);
  if (error) throw error;
}

export async function repoUpdateProductImagesMetadata(
  productId: string,
  images: ExistingProductImageOutput[],
): Promise<void> {
  if (images.length === 0) return;
  const supabase = createSupabaseAdminClient();
  const hasPrimary = images.some((img) => img.isPrimary);
  const normalized = hasPrimary
    ? images
    : images.map((img, idx) => ({ ...img, isPrimary: idx === 0 }));

  const { error: clearErr } = await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", productId);
  if (clearErr) throw clearErr;

  for (const img of normalized) {
    const { error } = await supabase
      .from("product_images")
      .update({ is_primary: img.isPrimary })
      .eq("id", img.id)
      .eq("product_id", productId);
    if (error) throw error;
  }
}

export async function repoListProductImageUrlsByIds(
  productId: string,
  imageIds: string[],
): Promise<string[]> {
  if (imageIds.length === 0) return [];
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("product_images")
    .select("url")
    .eq("product_id", productId)
    .in("id", imageIds);
  if (error) throw error;
  return (data ?? [])
    .map((row) => String((row as { url?: unknown }).url ?? ""))
    .filter(Boolean);
}

export async function repoDeleteProductImagesByIds(
  productId: string,
  imageIds: string[],
): Promise<void> {
  if (imageIds.length === 0) return;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", productId)
    .in("id", imageIds);
  if (error) throw error;
}

export async function repoReplaceProductCharacteristicValues(
  productId: string,
  values: ProductCharacteristicValueInput[],
): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const { error: deleteError } = await supabase
    .from("product_characteristic_values")
    .delete()
    .eq("product_id", productId);
  if (deleteError) throw deleteError;

  if (values.length === 0) return;

  const { error: insertError } = await supabase
    .from("product_characteristic_values")
    .insert(
      values.map((item) => ({
        product_id: productId,
        characteristic_specific_id: item.specificId,
        value: item.value?.trim() ? item.value.trim() : null,
      })),
    );
  if (insertError) throw insertError;
}