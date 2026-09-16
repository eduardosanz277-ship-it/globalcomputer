import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import {
  adminInvalidDataError,
  ensureAdminAccess,
  mapAdminEntityDbError,
  resolveAdminLocale,
} from "@/modules/admin/admin-errors";
import { APP_CONFIG_KEYS, type AppConfigSettings } from "./app-config.types";
import {
  repoGetAppConfigByKeys,
  repoUpsertAppConfigEntries,
} from "./app-config.repository";
import { appConfigFormSchema, type AppConfigFormValues } from "./app-config.schema";

function mapRowsToSettings(
  rows: { key: string; value: unknown }[]
): AppConfigSettings {
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const rawThreshold = map.low_stock_threshold;
  const threshold =
    typeof rawThreshold === "number"
      ? rawThreshold
      : typeof rawThreshold === "string"
        ? parseInt(rawThreshold, 10)
        : Number(rawThreshold);

  const lowStockOn =
    map.low_stock_notifications_enabled === true ||
    (map.low_stock_notifications_enabled === undefined &&
      map.notifications_enabled === true);
  const rawOfferAmount = map.offer_amount;
  const offerAmount =
    typeof rawOfferAmount === "number"
      ? rawOfferAmount
      : typeof rawOfferAmount === "string"
        ? parseFloat(rawOfferAmount)
        : Number(rawOfferAmount);
  const rawOfferPercentage = map.offer_percentage;
  const offerPercentage =
    typeof rawOfferPercentage === "number"
      ? rawOfferPercentage
      : typeof rawOfferPercentage === "string"
        ? parseFloat(rawOfferPercentage)
        : Number(rawOfferPercentage);

  return {
    supportEmail:
      typeof map.support_email === "string" ? map.support_email : "",
    supportPhone:
      typeof map.support_phone === "string" ? map.support_phone : "",
    supportAddress:
      typeof map.support_address === "string" ? map.support_address : "",
    lowStockNotificationsEnabled: lowStockOn,
    lowStockThreshold: Number.isFinite(threshold) ? threshold : 5,
    offerAmount: Number.isFinite(offerAmount) ? offerAmount : 0,
    offerPercentage: Number.isFinite(offerPercentage) ? offerPercentage : 0,
  };
}

export async function getAppConfigSettingsService(
  localeInput?: unknown,
): Promise<AppConfigSettings> {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  const rows = await repoGetAppConfigByKeys([
    ...APP_CONFIG_KEYS,
    // Legado (migración 20250317150000): copiar a low_stock_notifications_enabled
    "notifications_enabled",
  ]);
  return mapRowsToSettings(rows);
}

export async function updateAppConfigSettingsService(
  input: AppConfigFormValues,
  localeInput?: unknown,
) {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  const parsed = appConfigFormSchema.safeParse(input);
  if (!parsed.success) {
    throw adminInvalidDataError(locale, parsed.error.issues[0]?.message);
  }
  try {
    await repoUpsertAppConfigEntries([
      { key: "support_email", value: parsed.data.supportEmail },
      { key: "support_phone", value: parsed.data.supportPhone },
      { key: "support_address", value: parsed.data.supportAddress },
      {
        key: "low_stock_notifications_enabled",
        value: parsed.data.lowStockNotificationsEnabled,
      },
      { key: "low_stock_threshold", value: parsed.data.lowStockThreshold },
      { key: "offer_amount", value: parsed.data.offerAmount },
      { key: "offer_percentage", value: parsed.data.offerPercentage },
    ]);
  } catch (e) {
    throw mapAdminEntityDbError(e, locale, "settings", "saveFailed");
  }
}
