import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type {
  ShippingRate,
  ShippingRateInput,
} from "./shipping.types";

type ShippingRateRow = {
  id: string;
  min_amount: number | string;
  max_amount: number | string;
  cost: number | string;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function mapRate(row: ShippingRateRow): ShippingRate {
  return {
    id: row.id,
    minAmount: Number(row.min_amount),
    maxAmount: Number(row.max_amount),
    cost: Number(row.cost),
    active: Boolean(row.active),
    sortOrder: Number(row.sort_order),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT =
  "id, min_amount, max_amount, cost, active, sort_order, created_at, updated_at";

export async function repoListShippingRates(options?: {
  activeOnly?: boolean;
}): Promise<ShippingRate[]> {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("shipping_rates")
    .select(SELECT)
    .order("min_amount", { ascending: true })
    .order("sort_order", { ascending: true });

  if (options?.activeOnly) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as ShippingRateRow[]).map(mapRate);
}

export async function repoGetShippingRateById(
  id: string,
): Promise<ShippingRate | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("shipping_rates")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRate(data as ShippingRateRow) : null;
}

export async function repoCreateShippingRate(
  input: ShippingRateInput,
): Promise<ShippingRate> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("shipping_rates")
    .insert({
      min_amount: input.minAmount,
      max_amount: input.maxAmount,
      cost: input.cost,
      active: input.active,
      sort_order: input.sortOrder,
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  return mapRate(data as ShippingRateRow);
}

export async function repoUpdateShippingRate(
  id: string,
  input: ShippingRateInput,
): Promise<ShippingRate> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("shipping_rates")
    .update({
      min_amount: input.minAmount,
      max_amount: input.maxAmount,
      cost: input.cost,
      active: input.active,
      sort_order: input.sortOrder,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(SELECT)
    .single();
  if (error) throw error;
  return mapRate(data as ShippingRateRow);
}

export async function repoDeleteShippingRate(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("shipping_rates").delete().eq("id", id);
  if (error) throw error;
}

export async function repoSetShippingRateActive(
  id: string,
  active: boolean,
): Promise<ShippingRate> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("shipping_rates")
    .update({
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(SELECT)
    .single();
  if (error) throw error;
  return mapRate(data as ShippingRateRow);
}
