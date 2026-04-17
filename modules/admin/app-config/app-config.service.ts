import { getCurrentUserService } from "@/modules/auth/auth.service";
import type { UserRole } from "@/modules/auth/auth.types";
import { APP_CONFIG_KEYS, type AppConfigSettings } from "./app-config.types";
import {
  repoGetAppConfigByKeys,
  repoUpsertAppConfigEntries,
} from "./app-config.repository";
import { appConfigFormSchema, type AppConfigFormValues } from "./app-config.schema";

function ensureAdmin(role?: UserRole) {
  if (role !== "ADMIN") {
    throw new Error("Acceso restringido a administradores");
  }
}

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

  return {
    supportEmail:
      typeof map.support_email === "string" ? map.support_email : "",
    supportPhone:
      typeof map.support_phone === "string" ? map.support_phone : "",
    supportAddress:
      typeof map.support_address === "string" ? map.support_address : "",
    lowStockNotificationsEnabled: lowStockOn,
    lowStockThreshold: Number.isFinite(threshold) ? threshold : 5,
  };
}

export async function getAppConfigSettingsService(): Promise<AppConfigSettings> {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  const rows = await repoGetAppConfigByKeys([
    ...APP_CONFIG_KEYS,
    // Legado (migración 20250317150000): copiar a low_stock_notifications_enabled
    "notifications_enabled",
  ]);
  return mapRowsToSettings(rows);
}

export async function updateAppConfigSettingsService(input: AppConfigFormValues) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  const parsed = appConfigFormSchema.parse(input);
  await repoUpsertAppConfigEntries([
    { key: "support_email", value: parsed.supportEmail },
    { key: "support_phone", value: parsed.supportPhone },
    { key: "support_address", value: parsed.supportAddress },
    {
      key: "low_stock_notifications_enabled",
      value: parsed.lowStockNotificationsEnabled,
    },
    { key: "low_stock_threshold", value: parsed.lowStockThreshold },
  ]);
}
