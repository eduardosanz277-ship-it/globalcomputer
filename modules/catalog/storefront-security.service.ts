import { slugify } from "@/lib/slugify";
import { getCatalogSupabase } from "@/lib/supabaseCatalogClient";
import { failOnNetworkError } from "@/lib/errors/rsc-network-error";

function warnUnlessNetwork(error: unknown, context: string): void {
  failOnNetworkError(error);
  if (error) console.warn(context, error);
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

function mapNameEn(row: Record<string, unknown>): string | null {
  const raw = row.name_en;
  if (raw == null || String(raw).trim() === "") return null;
  return String(raw);
}

export type StorefrontSecurityGeneralRow = {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string;
};

export type StorefrontSecuritySpecificRow = {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string;
  general_id: string;
};

export async function getCharacteristicGeneralById(
  generalId: string,
): Promise<StorefrontSecurityGeneralRow | null> {
  const supabase = await getCatalogSupabase();
  let { data, error } = await supabase
    .from("product_characteristics_general")
    .select("id, name, name_en, slug, active")
    .eq("id", generalId)
    .maybeSingle();

  if (error && looksLikeMissingColumnError(error)) {
    const r = await supabase
      .from("product_characteristics_general")
      .select("id, name, slug, active")
      .eq("id", generalId)
      .maybeSingle();
    data = r.data as typeof data;
    error = r.error;
  }

  if (error && looksLikeMissingColumnError(error)) {
    const r2 = await supabase
      .from("product_characteristics_general")
      .select("id, name")
      .eq("id", generalId)
      .maybeSingle();
    data = r2.data as typeof data;
    error = r2.error;
  }

  if (error) {
    warnUnlessNetwork(error, `[storefront-security] getCharacteristicGeneralById ${generalId}`);
    return null;
  }
  if (!data) return null;
  if ("active" in data && data.active === false) return null;
  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    name: row.name as string,
    nameEn: mapNameEn(row),
    slug: (row.slug as string | null | undefined) ?? slugify(String(row.name)),
  };
}

/**
 * Característica específica por id (incluye `general_id` para validar URL).
 */
export async function getCharacteristicSpecificById(
  specificId: string,
): Promise<StorefrontSecuritySpecificRow | null> {
  const supabase = await getCatalogSupabase();
  let { data, error } = await supabase
    .from("product_characteristics_specific")
    .select("id, name, name_en, slug, general_id, active")
    .eq("id", specificId)
    .maybeSingle();

  if (error && looksLikeMissingColumnError(error)) {
    const r = await supabase
      .from("product_characteristics_specific")
      .select("id, name, slug, general_id")
      .eq("id", specificId)
      .maybeSingle();
    data = r.data as typeof data;
    error = r.error;
  }

  if (error && looksLikeMissingColumnError(error)) {
    const r2 = await supabase
      .from("product_characteristics_specific")
      .select("id, name, general_id")
      .eq("id", specificId)
      .maybeSingle();
    data = r2.data as typeof data;
    error = r2.error;
  }

  if (error) {
    warnUnlessNetwork(error, `[storefront-security] getCharacteristicSpecificById ${specificId}`);
    return null;
  }
  if (!data) return null;
  if ("active" in data && data.active === false) return null;
  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    name: row.name as string,
    nameEn: mapNameEn(row),
    slug: (row.slug as string | null | undefined) ?? slugify(String(row.name)),
    general_id: row.general_id as string,
  };
}

export async function getCharacteristicGeneralBySlug(
  slug: string,
): Promise<StorefrontSecurityGeneralRow | null> {
  const normalizedSlug = slugify(slug);
  const supabase = await getCatalogSupabase();
  let { data, error } = await supabase
    .from("product_characteristics_general")
    .select("id, name, name_en, slug, active")
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (error && looksLikeMissingColumnError(error)) {
    const r = await supabase
      .from("product_characteristics_general")
      .select("id, name, slug, active")
      .eq("slug", normalizedSlug)
      .maybeSingle();
    data = r.data as typeof data;
    error = r.error;
  }

  if (error) {
    if (looksLikeMissingColumnError(error)) return null;
    warnUnlessNetwork(error, `[storefront-security] getCharacteristicGeneralBySlug ${slug}`);
    return null;
  }
  if (!data) return null;
  if ("active" in data && data.active === false) return null;
  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    name: row.name as string,
    nameEn: mapNameEn(row),
    slug: (row.slug as string | null | undefined) ?? normalizedSlug,
  };
}

export async function getCharacteristicSpecificBySlug(
  generalId: string,
  slug: string,
): Promise<StorefrontSecuritySpecificRow | null> {
  const normalizedSlug = slugify(slug);
  const supabase = await getCatalogSupabase();
  let { data, error } = await supabase
    .from("product_characteristics_specific")
    .select("id, name, name_en, slug, general_id, active")
    .eq("slug", normalizedSlug)
    .eq("general_id", generalId)
    .maybeSingle();

  if (error && looksLikeMissingColumnError(error)) {
    const r = await supabase
      .from("product_characteristics_specific")
      .select("id, name, slug, general_id, active")
      .eq("slug", normalizedSlug)
      .eq("general_id", generalId)
      .maybeSingle();
    data = r.data as typeof data;
    error = r.error;
  }

  if (error) {
    if (looksLikeMissingColumnError(error)) return null;
    warnUnlessNetwork(
      error,
      `[storefront-security] getCharacteristicSpecificBySlug ${generalId}/${slug}`,
    );
    return null;
  }
  if (!data) return null;
  if ("active" in data && data.active === false) return null;
  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    name: row.name as string,
    nameEn: mapNameEn(row),
    slug: (row.slug as string | null | undefined) ?? normalizedSlug,
    general_id: row.general_id as string,
  };
}

export async function getCharacteristicGeneralBySlugOrId(
  param: string,
): Promise<{ general: StorefrontSecurityGeneralRow; source: "slug" | "id" } | null> {
  const slugResult = await getCharacteristicGeneralBySlug(param);
  if (slugResult) return { general: slugResult, source: "slug" };

  const idRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!idRe.test(param)) return null;

  const idResult = await getCharacteristicGeneralById(param);
  if (!idResult) return null;
  return { general: idResult, source: "id" };
}

export async function getCharacteristicSpecificBySlugOrId(
  generalId: string,
  param: string,
): Promise<
  { specific: StorefrontSecuritySpecificRow; source: "slug" | "id" } | null
> {
  const slugResult = await getCharacteristicSpecificBySlug(generalId, param);
  if (slugResult) return { specific: slugResult, source: "slug" };

  const idRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!idRe.test(param)) return null;

  const idResult = await getCharacteristicSpecificById(param);
  if (!idResult || idResult.general_id !== generalId) return null;
  return { specific: idResult, source: "id" };
}

