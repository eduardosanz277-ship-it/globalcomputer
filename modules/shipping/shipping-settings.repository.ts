import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type {
  ShippingFreeSurchargeBehavior,
  ShippingOverLimitAction,
  ShippingSettings,
  ShippingSettingsInput,
} from "./shipping.types";

type ShippingSettingsRow = {
  id: string;
  auto_calc_max_subtotal: number | string;
  over_limit_action: ShippingOverLimitAction;
  whatsapp_phone: string;
  whatsapp_message: string;
  free_shipping_enabled: boolean;
  free_shipping_min_subtotal: number | string;
  free_shipping_surcharge_behavior: ShippingFreeSurchargeBehavior;
  updated_at: string;
};

function mapSettings(row: ShippingSettingsRow): ShippingSettings {
  return {
    id: row.id,
    autoCalcMaxSubtotal: Number(row.auto_calc_max_subtotal),
    overLimitAction: row.over_limit_action,
    whatsappPhone: row.whatsapp_phone ?? "",
    whatsappMessage: row.whatsapp_message ?? "",
    freeShippingEnabled: Boolean(row.free_shipping_enabled),
    freeShippingMinSubtotal: Number(row.free_shipping_min_subtotal),
    freeShippingSurchargeBehavior: row.free_shipping_surcharge_behavior,
    updatedAt: row.updated_at,
  };
}

const SELECT =
  "id, auto_calc_max_subtotal, over_limit_action, whatsapp_phone, whatsapp_message, free_shipping_enabled, free_shipping_min_subtotal, free_shipping_surcharge_behavior, updated_at";

export async function repoGetShippingSettings(): Promise<ShippingSettings> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("shipping_settings")
    .select(SELECT)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error("No hay configuración de envíos. Ejecuta las migraciones.");
  }
  return mapSettings(data as ShippingSettingsRow);
}

export async function repoUpdateShippingSettings(
  input: ShippingSettingsInput,
): Promise<ShippingSettings> {
  const current = await repoGetShippingSettings();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("shipping_settings")
    .update({
      auto_calc_max_subtotal: input.autoCalcMaxSubtotal,
      over_limit_action: input.overLimitAction,
      whatsapp_phone: input.whatsappPhone,
      whatsapp_message: input.whatsappMessage,
      free_shipping_enabled: input.freeShippingEnabled,
      free_shipping_min_subtotal: input.freeShippingMinSubtotal,
      free_shipping_surcharge_behavior: input.freeShippingSurchargeBehavior,
      updated_at: new Date().toISOString(),
    })
    .eq("id", current.id)
    .select(SELECT)
    .single();

  if (error) throw error;
  return mapSettings(data as ShippingSettingsRow);
}
