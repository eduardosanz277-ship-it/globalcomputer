"use server";

import type { AppConfigFormValues } from "./app-config.schema";
import { updateAppConfigSettingsService } from "./app-config.service";
import {
  runServerAction,
  type ServerActionResult,
} from "@/lib/errors/run-server-action";
import { resolveAdminLocale } from "@/modules/admin/admin-errors";

export async function updateAppConfigAction(
  data: AppConfigFormValues,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.settings.saveFailed",
    () => updateAppConfigSettingsService(data, resolvedLocale),
  );
}
