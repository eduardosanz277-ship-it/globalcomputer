"use server";

import {
  createBrandTypeService,
  deleteBrandTypeService,
  updateBrandTypeService,
} from "@/modules/admin/brand-types/brand-types.service";
import type {
  BrandTypeInsert,
  BrandTypeUpdate,
} from "@/modules/admin/brand-types/brand-types.types";
import {
  runServerAction,
  type ServerActionResult,
} from "@/lib/errors/run-server-action";
import { resolveAdminLocale } from "@/modules/admin/admin-errors";

export async function createBrandTypeAction(
  values: BrandTypeInsert,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.brandTypes.createFailed",
    () => createBrandTypeService(values, resolvedLocale),
  );
}

export async function updateBrandTypeAction(
  id: string,
  values: BrandTypeUpdate,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.brandTypes.updateFailed",
    () => updateBrandTypeService(id, values, resolvedLocale),
  );
}

export async function deleteBrandTypeAction(
  id: string,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.brandTypes.deleteFailed",
    () => deleteBrandTypeService(id, resolvedLocale),
  );
}
