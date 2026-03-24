import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { Brand, BrandInsert, BrandUpdate } from "./brands.types";

type BrandRow = {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

function mapRow(row: BrandRow): Brand {
  return {
    id: row.id,
    name: row.name,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function repoListBrands(): Promise<Brand[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("brands")
    .select("id, name, active, created_at, updated_at")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as BrandRow[]).map(mapRow);
}

export async function repoCreateBrand(payload: BrandInsert): Promise<Brand> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("brands")
    .insert({
      name: payload.name,
      active: payload.active,
    })
    .select("id, name, active, created_at, updated_at")
    .single();

  if (error) throw error;
  return mapRow(data as BrandRow);
}

export async function repoUpdateBrand(
  id: string,
  payload: BrandUpdate
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("brands")
    .update({
      name: payload.name,
      active: payload.active,
    })
    .eq("id", id);

  if (error) throw error;
}

export async function repoDeleteBrand(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("brands").delete().eq("id", id);

  if (error) throw error;
}
