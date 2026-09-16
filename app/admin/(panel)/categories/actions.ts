"use server";

import {
  createCategoryAdminService,
  softDeleteCategoryAdminService,
  updateCategoryAdminService,
} from "@/modules/admin/categories/categories.service";
import type {
  CategoryAdminInsert,
  CategoryAdminUpdate,
} from "@/modules/admin/categories/categories.types";
import {
  runServerAction,
  type ServerActionResult,
} from "@/lib/errors/run-server-action";
import { resolveAdminLocale } from "@/modules/admin/admin-errors";

export async function createCategoryAdminAction(
  values: CategoryAdminInsert,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.categories.createFailed",
    () => createCategoryAdminService(values, resolvedLocale),
  );
}

export async function updateCategoryAdminAction(
  id: string,
  values: CategoryAdminUpdate,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.categories.updateFailed",
    () => updateCategoryAdminService(id, values, resolvedLocale),
  );
}

export async function softDeleteCategoryAdminAction(
  id: string,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.categories.archiveFailed",
    () => softDeleteCategoryAdminService(id, resolvedLocale),
  );
}
