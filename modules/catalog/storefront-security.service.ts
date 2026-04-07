import { getCatalogSupabase } from "@/lib/supabaseCatalogClient";
import {
  mapStorefrontProductRow,
  STOREFRONT_PRODUCT_SELECT,
  type StorefrontProduct,
} from "@/modules/catalog/storefront-products.service";

function looksLikeMissingColumnError(error: { message?: string } | null): boolean {
  const m = error?.message ?? "";
  return (
    m.includes("column") ||
    m.includes("schema cache") ||
    m.includes("Could not find") ||
    m.includes("does not exist")
  );
}

export async function getCharacteristicGeneralById(
  generalId: string,
): Promise<{ id: string; name: string } | null> {
  const supabase = await getCatalogSupabase();
  let { data, error } = await supabase
    .from("product_characteristics_general")
    .select("id, name, active")
    .eq("id", generalId)
    .maybeSingle();

  if (error && looksLikeMissingColumnError(error)) {
    const r = await supabase
      .from("product_characteristics_general")
      .select("id, name")
      .eq("id", generalId)
      .maybeSingle();
    data = r.data as typeof data;
    error = r.error;
  }

  if (error) {
    console.warn("[storefront-security] getCharacteristicGeneralById", generalId, error.message);
    return null;
  }
  if (!data) return null;
  if ("active" in data && data.active === false) return null;
  return { id: data.id, name: data.name };
}

export async function listSpecificsForGeneral(
  generalId: string,
): Promise<{ id: string; name: string }[]> {
  const supabase = await getCatalogSupabase();
  let { data, error } = await supabase
    .from("product_characteristics_specific")
    .select("id, name, active")
    .eq("general_id", generalId)
    .order("name");

  if (error && looksLikeMissingColumnError(error)) {
    const r = await supabase
      .from("product_characteristics_specific")
      .select("id, name")
      .eq("general_id", generalId)
      .order("name");
    data = r.data as typeof data;
    error = r.error;
  }

  if (error) {
    console.warn("[storefront-security] listSpecificsForGeneral", generalId, error.message);
    return [];
  }
  if (!data) return [];
  return data
    .filter((r) => !("active" in r) || r.active !== false)
    .map((r) => ({ id: r.id, name: r.name }));
}

/**
 * Característica específica por id (incluye `general_id` para validar URL).
 */
export async function getCharacteristicSpecificById(
  specificId: string,
): Promise<{ id: string; name: string; general_id: string } | null> {
  const supabase = await getCatalogSupabase();
  let { data, error } = await supabase
    .from("product_characteristics_specific")
    .select("id, name, general_id, active")
    .eq("id", specificId)
    .maybeSingle();

  if (error && looksLikeMissingColumnError(error)) {
    const r = await supabase
      .from("product_characteristics_specific")
      .select("id, name, general_id")
      .eq("id", specificId)
      .maybeSingle();
    data = r.data as typeof data;
    error = r.error;
  }

  if (error) {
    console.warn("[storefront-security] getCharacteristicSpecificById", specificId, error.message);
    return null;
  }
  if (!data) return null;
  if ("active" in data && data.active === false) return null;
  return {
    id: data.id,
    name: data.name,
    general_id: data.general_id,
  };
}

/**
 * Todos los productos activos vinculados a cualquier característica específica
 * bajo el general indicado (equivalente a “toda la marca” en Comprar por marca).
 */
export async function listProductsByGeneralId(
  generalId: string,
): Promise<StorefrontProduct[]> {
  const specifics = await listSpecificsForGeneral(generalId);
  if (specifics.length === 0) return [];

  const supabase = await getCatalogSupabase();
  const specificIds = specifics.map((s) => s.id);

  const { data: links, error: linkErr } = await supabase
    .from("product_characteristic_values")
    .select("product_id")
    .in("characteristic_specific_id", specificIds);

  if (linkErr) {
    console.warn(
      "[storefront-security] product_characteristic_values (general)",
      generalId,
      linkErr.message,
    );
    return [];
  }
  if (!links?.length) return [];

  const productIds = [...new Set(links.map((l) => l.product_id))];

  const { data: rows, error: prodErr } = await supabase
    .from("products")
    .select(STOREFRONT_PRODUCT_SELECT)
    .in("id", productIds)
    .eq("active", true)
    .order("name");

  if (prodErr || !rows) return [];
  return rows.map((row) => mapStorefrontProductRow(row as Record<string, unknown>));
}

/** Productos que tienen valor asignado a la característica específica (y pertenece al general indicado). */
export async function listProductsByGeneralAndSpecific(
  generalId: string,
  specificId: string,
): Promise<StorefrontProduct[]> {
  const specific = await getCharacteristicSpecificById(specificId);
  if (!specific || specific.general_id !== generalId) return [];

  const supabase = await getCatalogSupabase();
  const { data: links, error: linkErr } = await supabase
    .from("product_characteristic_values")
    .select("product_id")
    .eq("characteristic_specific_id", specificId);

  if (linkErr) {
    console.warn(
      "[storefront-security] product_characteristic_values",
      specificId,
      linkErr.message,
    );
    return [];
  }
  if (!links?.length) return [];

  const productIds = [...new Set(links.map((l) => l.product_id))];

  const { data: rows, error: prodErr } = await supabase
    .from("products")
    .select(STOREFRONT_PRODUCT_SELECT)
    .in("id", productIds)
    .eq("active", true)
    .order("name");

  if (prodErr || !rows) return [];
  return rows.map((row) => mapStorefrontProductRow(row as Record<string, unknown>));
}
