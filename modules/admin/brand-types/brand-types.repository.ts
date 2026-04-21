import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type {
  BrandType,
  BrandTypeInsert,
  BrandTypeUpdate,
} from "./brand-types.types";

type BrandTypeRow = {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  brands: { name: string } | { name: string }[] | null;
};

function brandNameFromRow(row: BrandTypeRow): string {
  const b = row.brands;
  if (!b) return "—";
  if (Array.isArray(b)) return b[0]?.name ?? "—";
  return b.name ?? "—";
}

function mapRow(row: BrandTypeRow): BrandType {
  return {
    id: row.id,
    brandId: row.brand_id,
    brandName: brandNameFromRow(row),
    name: row.name,
    slug: row.slug,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function repoListBrandTypes(): Promise<BrandType[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("brand_types")
    .select(
      "id, brand_id, name, slug, active, created_at, updated_at, brands ( name )"
    )
    .order("name", { ascending: true });

  if (error) throw error;
  const mapped = (data as BrandTypeRow[]).map(mapRow);
  return mapped.sort((a, b) => {
    const byBrand = a.brandName.localeCompare(b.brandName, "es");
    if (byBrand !== 0) return byBrand;
    return a.name.localeCompare(b.name, "es");
  });
}

export async function repoCreateBrandType(
  payload: BrandTypeInsert
): Promise<BrandType> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("brand_types")
    .insert({
      brand_id: payload.brandId,
      name: payload.name,
      slug: payload.slug,
      active: payload.active,
    })
    .select(
      "id, brand_id, name, slug, active, created_at, updated_at, brands ( name )",
    )
    .single();

  if (error) throw error;
  return mapRow(data as BrandTypeRow);
}

export async function repoUpdateBrandType(
  id: string,
  payload: BrandTypeUpdate
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("brand_types")
    .update({
      brand_id: payload.brandId,
      name: payload.name,
      slug: payload.slug,
      active: payload.active,
    })
    .eq("id", id);

  if (error) throw error;
}

export async function repoDeleteBrandType(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("brand_types").delete().eq("id", id);

  if (error) throw error;
}
