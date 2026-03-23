"use server";

import type { AppConfigFormValues } from "./app-config.schema";
import { updateAppConfigSettingsService } from "./app-config.service";

export async function updateAppConfigAction(data: AppConfigFormValues) {
  await updateAppConfigSettingsService(data);
}
