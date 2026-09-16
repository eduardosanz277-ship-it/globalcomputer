"use server";

import {
  createFaqAdminService,
  deleteFaqAdminService,
  updateFaqAdminService,
} from "@/modules/admin/faqs/faqs.service";
import type {
  FaqAdminInsert,
  FaqAdminUpdate,
} from "@/modules/admin/faqs/faqs.types";
import {
  runServerAction,
  type ServerActionResult,
} from "@/lib/errors/run-server-action";
import { resolveAdminLocale } from "@/modules/admin/admin-errors";

export async function createFaqAdminAction(
  values: FaqAdminInsert,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(resolvedLocale, "admin.errors.faqs.createFailed", () =>
    createFaqAdminService(values, resolvedLocale),
  );
}

export async function updateFaqAdminAction(
  id: string,
  values: FaqAdminUpdate,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(resolvedLocale, "admin.errors.faqs.updateFailed", () =>
    updateFaqAdminService(id, values, resolvedLocale),
  );
}

export async function deleteFaqAdminAction(
  id: string,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(resolvedLocale, "admin.errors.faqs.deleteFailed", () =>
    deleteFaqAdminService(id, resolvedLocale),
  );
}
