import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type {
  ShippingFreeSurchargeBehavior,
  ShippingOverLimitAction,
  ShippingPendingPaymentWaitUnit,
  ShippingSettings,
  ShippingSettingsInput,
} from "./shipping.types";

type ShippingSettingsRow = {
  id: string;
  auto_calc_max_subtotal: number | string;
  over_limit_action: ShippingOverLimitAction;
  whatsapp_phone: string;
  whatsapp_message: string;
  whatsapp_message_en: string | null;
  free_shipping_enabled: boolean;
  free_shipping_min_subtotal: number | string;
  free_shipping_surcharge_behavior: ShippingFreeSurchargeBehavior;
  pending_payment_max_wait_value: number | string | null;
  pending_payment_max_wait_unit: string | null;
  updated_at: string;
};

function mapWaitUnit(raw: string | null): ShippingPendingPaymentWaitUnit {
  if (raw === "minutes" || raw === "hours") return raw;
  return "days";
}

function mapSettings(row: ShippingSettingsRow): ShippingSettings {
  return {
    id: row.id,
    autoCalcMaxSubtotal: Number(row.auto_calc_max_subtotal),
    overLimitAction: row.over_limit_action,
    whatsappPhone: row.whatsapp_phone ?? "",
    whatsappMessage: row.whatsapp_message ?? "",
    whatsappMessageEn: row.whatsapp_message_en ?? "",
    freeShippingEnabled: Boolean(row.free_shipping_enabled),
    freeShippingMinSubtotal: Number(row.free_shipping_min_subtotal),
    freeShippingSurchargeBehavior: row.free_shipping_surcharge_behavior,
    pendingPaymentMaxWaitValue: Math.max(
      1,
      Number(row.pending_payment_max_wait_value) || 7,
    ),
    pendingPaymentMaxWaitUnit: mapWaitUnit(row.pending_payment_max_wait_unit),
    updatedAt: row.updated_at,
  };
}

const SELECT =
  "id, auto_calc_max_subtotal, over_limit_action, whatsapp_phone, whatsapp_message, whatsapp_message_en, free_shipping_enabled, free_shipping_min_subtotal, free_shipping_surcharge_behavior, pending_payment_max_wait_value, pending_payment_max_wait_unit, updated_at";

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
      whatsapp_message_en: input.whatsappMessageEn,
      free_shipping_enabled: input.freeShippingEnabled,
      free_shipping_min_subtotal: input.freeShippingMinSubtotal,
      free_shipping_surcharge_behavior: input.freeShippingSurchargeBehavior,
      pending_payment_max_wait_value: input.pendingPaymentMaxWaitValue,
      pending_payment_max_wait_unit: input.pendingPaymentMaxWaitUnit,
      updated_at: new Date().toISOString(),
    })
    .eq("id", current.id)
    .select(SELECT)
    .single();

  if (error) throw error;
  return mapSettings(data as ShippingSettingsRow);
}
