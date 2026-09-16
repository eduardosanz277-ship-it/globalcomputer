"use server";

import {
  createBrandService,
  deleteBrandService,
  updateBrandService,
} from "@/modules/admin/brands/brands.service";
import type { BrandInsert, BrandUpdate } from "@/modules/admin/brands/brands.types";
import {
  runServerAction,
  type ServerActionResult,
} from "@/lib/errors/run-server-action";
import { resolveAdminLocale } from "@/modules/admin/admin-errors";

export async function createBrandAction(
  values: BrandInsert,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(resolvedLocale, "admin.errors.brands.createFailed", () =>
    createBrandService(values, resolvedLocale),
  );
}

export async function updateBrandAction(
  id: string,
  values: BrandUpdate,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(resolvedLocale, "admin.errors.brands.updateFailed", () =>
    updateBrandService(id, values, resolvedLocale),
  );
}

export async function deleteBrandAction(
  id: string,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(resolvedLocale, "admin.errors.brands.deleteFailed", () =>
    deleteBrandService(id, resolvedLocale),
  );
}
