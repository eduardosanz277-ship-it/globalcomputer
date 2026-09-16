"use server";

import {
  deleteProductReviewAdminService,
  updateProductReviewActiveAdminService,
} from "./product-reviews.service";
import {
  runServerAction,
  type ServerActionResult,
} from "@/lib/errors/run-server-action";
import { resolveAdminLocale } from "@/modules/admin/admin-errors";

export async function updateProductReviewActiveAdminAction(
  id: string,
  active: boolean,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.productReviews.toggleFailed",
    () => updateProductReviewActiveAdminService(id, active, resolvedLocale),
  );
}

export async function deleteProductReviewAdminAction(
  id: string,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.productReviews.deleteFailed",
    () => deleteProductReviewAdminService(id, resolvedLocale),
  );
}
