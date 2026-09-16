"use server";

import {
  createGeneralCharacteristicService,
  deleteGeneralCharacteristicService,
  updateGeneralCharacteristicService,
} from "@/modules/admin/general-characteristics/general-characteristics.service";
import type {
  GeneralCharacteristicInsert,
  GeneralCharacteristicUpdate,
} from "@/modules/admin/general-characteristics/general-characteristics.types";
import {
  runServerAction,
  type ServerActionResult,
} from "@/lib/errors/run-server-action";
import { resolveAdminLocale } from "@/modules/admin/admin-errors";

export async function createGeneralCharacteristicAction(
  values: GeneralCharacteristicInsert,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.generalCharacteristics.createFailed",
    () => createGeneralCharacteristicService(values, resolvedLocale),
  );
}

export async function updateGeneralCharacteristicAction(
  id: string,
  values: GeneralCharacteristicUpdate,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.generalCharacteristics.updateFailed",
    () => updateGeneralCharacteristicService(id, values, resolvedLocale),
  );
}

export async function deleteGeneralCharacteristicAction(
  id: string,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.generalCharacteristics.deleteFailed",
    () => deleteGeneralCharacteristicService(id, resolvedLocale),
  );
}
