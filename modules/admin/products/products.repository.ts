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
  description: string | null;
  stock: number;
  price: number;
  active: boolean;
  discount_business_pct: number;
  discount_client: number;
  manual_pdf_url: string | null;
  brand_id: string;
  brand_type_id: string | null;
  created_at: string;
  updated_at: string;
  brands: { name: string } | { name: string }[] | null;
  brand_types: { name: string } | { name: string }[] | null;
  product_images?: Array<{ id: string; url: string; is_primary: boolean }>;
  product_characteristic_values?: Array<{
    id: string;
    characteristic_specific_id: string;
    value: string | null;
    product_characteristics_specific:
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
      | null;
  }>;
};

function relationName(
  rel: { name?: string } | { name?: string }[] | null | undefined,
): string {
  if (!rel) return "—";
  if (Array.isArray(rel)) return rel[0]?.name ?? "—";
  return rel.name ?? "—";
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

function mapRow(row: ProductRow): Product {
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
        return {
          id: cv.id,
          specificId: cv.characteristic_specific_id,
          specificName: specific?.name ?? "—",
          generalName,
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
    description: row.description,
    stock: row.stock,
    price: row.price,
    active: row.active,
    discountBusinessPct: row.discount_business_pct,
    discountClient: row.discount_client,
    manualPdfUrl: row.manual_pdf_url,
    brandId: row.brand_id,
    brandName: relationName(row.brands),
    brandTypeId: row.brand_type_id ?? "",
    brandTypeName: relationName(row.brand_types),
    imageUrl: primaryImage?.url ?? null,
    images,
    characteristicValues,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const PRODUCT_SELECT =
  "id, sku, name, description, stock, price, active, discount_business_pct, discount_client, manual_pdf_url, brand_id, brand_type_id, created_at, updated_at, brands(name), brand_types(name), product_images(id, url, is_primary), product_characteristic_values(id, characteristic_specific_id, value, product_characteristics_specific(name, product_characteristics_general(name)))";

export async function repoListProducts(): Promise<Product[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as ProductRow[]).map(mapRow);
}

export async function repoCreateProduct(payload: ProductInsert): Promise<Product> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      sku: payload.sku,
      name: payload.name,
      description: payload.description || null,
      stock: payload.stock,
      price: payload.price,
      active: payload.active,
      discount_business_pct: payload.discountBusinessPct,
      discount_client: payload.discountClient,
      manual_pdf_url: payload.manualPdfUrl || null,
      brand_id: payload.brandId,
      brand_type_id: payload.brandTypeId || null,
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
      sku: payload.sku,
      name: payload.name,
      description: payload.description || null,
      stock: payload.stock,
      price: payload.price,
      active: payload.active,
      discount_business_pct: payload.discountBusinessPct,
      discount_client: payload.discountClient,
      manual_pdf_url: payload.manualPdfUrl || null,
      brand_id: payload.brandId,
      brand_type_id: payload.brandTypeId || null,
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