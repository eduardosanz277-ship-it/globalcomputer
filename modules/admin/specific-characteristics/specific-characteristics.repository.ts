import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type {
  SpecificCharacteristic,
  SpecificCharacteristicInsert,
  SpecificCharacteristicUpdate,
} from "./specific-characteristics.types";

type SpecificCharacteristicRow = {
  id: string;
  general_id: string;
  name: string;
  slug: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  product_characteristics_general:
    | { name: string }
    | { name: string }[]
    | null;
};

function generalNameFromRow(row: SpecificCharacteristicRow): string {
  const g = row.product_characteristics_general;
  if (!g) return "—";
  if (Array.isArray(g)) return g[0]?.name ?? "—";
  return g.name ?? "—";
}

function mapRow(row: SpecificCharacteristicRow): SpecificCharacteristic {
  return {
    id: row.id,
    generalId: row.general_id,
    generalName: generalNameFromRow(row),
    name: row.name,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    slug: row.slug,
  };
}

export async function repoListSpecificCharacteristics(): Promise<
  SpecificCharacteristic[]
> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("product_characteristics_specific")
    .select(
      "id, general_id, name, slug, active, created_at, updated_at, product_characteristics_general ( name )"
    )
    .order("name", { ascending: true });

  if (error) throw error;
  const mapped = (data as SpecificCharacteristicRow[]).map(mapRow);
  return mapped.sort((a, b) => {
    const byGeneral = a.generalName.localeCompare(b.generalName, "es");
    if (byGeneral !== 0) return byGeneral;
    return a.name.localeCompare(b.name, "es");
  });
}

export async function repoCreateSpecificCharacteristic(
  payload: SpecificCharacteristicInsert
): Promise<SpecificCharacteristic> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("product_characteristics_specific")
    .insert({
      general_id: payload.generalId,
      name: payload.name,
      slug: payload.slug,
      active: payload.active,
    })
    .select(
      "id, general_id, name, slug, active, created_at, updated_at, product_characteristics_general ( name )"
    )
    .single();

  if (error) throw error;
  return mapRow(data as SpecificCharacteristicRow);
}

export async function repoUpdateSpecificCharacteristic(
  id: string,
  payload: SpecificCharacteristicUpdate
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("product_characteristics_specific")
    .update({
      general_id: payload.generalId,
      name: payload.name,
      slug: payload.slug,
      active: payload.active,
    })
    .eq("id", id);

  if (error) throw error;
}

export async function repoDeleteSpecificCharacteristic(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("product_characteristics_specific")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
