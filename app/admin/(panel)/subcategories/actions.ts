"use server";

import {
  createSubcategoryAdminService,
  softDeleteSubcategoryAdminService,
  updateSubcategoryAdminService,
} from "@/modules/admin/subcategories/subcategories.service";
import type {
  SubcategoryAdminInsert,
  SubcategoryAdminUpdate,
} from "@/modules/admin/subcategories/subcategories.types";
import {
  runServerAction,
  type ServerActionResult,
} from "@/lib/errors/run-server-action";
import { resolveAdminLocale } from "@/modules/admin/admin-errors";

export async function createSubcategoryAdminAction(
  values: SubcategoryAdminInsert,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.subcategories.createFailed",
    () => createSubcategoryAdminService(values, resolvedLocale),
  );
}

export async function updateSubcategoryAdminAction(
  id: string,
  values: SubcategoryAdminUpdate,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.subcategories.updateFailed",
    () => updateSubcategoryAdminService(id, values, resolvedLocale),
  );
}

export async function softDeleteSubcategoryAdminAction(
  id: string,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.subcategories.archiveFailed",
    () => softDeleteSubcategoryAdminService(id, resolvedLocale),
  );
}
