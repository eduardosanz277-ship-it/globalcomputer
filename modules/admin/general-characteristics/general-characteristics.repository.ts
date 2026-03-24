import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type {
  GeneralCharacteristic,
  GeneralCharacteristicInsert,
  GeneralCharacteristicUpdate,
} from "./general-characteristics.types";

type GeneralCharacteristicRow = {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

function mapRow(row: GeneralCharacteristicRow): GeneralCharacteristic {
  return {
    id: row.id,
    name: row.name,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function repoListGeneralCharacteristics(): Promise<
  GeneralCharacteristic[]
> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("product_characteristics_general")
    .select("id, name, active, created_at, updated_at")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as GeneralCharacteristicRow[]).map(mapRow);
}

export async function repoCreateGeneralCharacteristic(
  payload: GeneralCharacteristicInsert
): Promise<GeneralCharacteristic> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("product_characteristics_general")
    .insert({
      name: payload.name,
      active: payload.active,
    })
    .select("id, name, active, created_at, updated_at")
    .single();

  if (error) throw error;
  return mapRow(data as GeneralCharacteristicRow);
}

export async function repoUpdateGeneralCharacteristic(
  id: string,
  payload: GeneralCharacteristicUpdate
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("product_characteristics_general")
    .update({
      name: payload.name,
      active: payload.active,
    })
    .eq("id", id);

  if (error) throw error;
}

export async function repoDeleteGeneralCharacteristic(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("product_characteristics_general")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
