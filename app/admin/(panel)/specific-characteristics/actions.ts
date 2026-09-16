"use server";

import {
  createSpecificCharacteristicService,
  deleteSpecificCharacteristicService,
  updateSpecificCharacteristicService,
} from "@/modules/admin/specific-characteristics/specific-characteristics.service";
import type {
  SpecificCharacteristicInsert,
  SpecificCharacteristicUpdate,
} from "@/modules/admin/specific-characteristics/specific-characteristics.types";
import {
  runServerAction,
  type ServerActionResult,
} from "@/lib/errors/run-server-action";
import { resolveAdminLocale } from "@/modules/admin/admin-errors";

export async function createSpecificCharacteristicAction(
  values: SpecificCharacteristicInsert,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.specificCharacteristics.createFailed",
    () => createSpecificCharacteristicService(values, resolvedLocale),
  );
}

export async function updateSpecificCharacteristicAction(
  id: string,
  values: SpecificCharacteristicUpdate,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.specificCharacteristics.updateFailed",
    () => updateSpecificCharacteristicService(id, values, resolvedLocale),
  );
}

export async function deleteSpecificCharacteristicAction(
  id: string,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.specificCharacteristics.deleteFailed",
    () => deleteSpecificCharacteristicService(id, resolvedLocale),
  );
}
