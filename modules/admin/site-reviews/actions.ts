"use server";

import {
  deleteSiteReviewAdminService,
  updateSiteReviewActiveAdminService,
} from "./site-reviews.service";
import {
  runServerAction,
  type ServerActionResult,
} from "@/lib/errors/run-server-action";
import { resolveAdminLocale } from "@/modules/admin/admin-errors";

export async function updateSiteReviewActiveAdminAction(
  id: string,
  active: boolean,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.siteReviews.toggleFailed",
    () => updateSiteReviewActiveAdminService(id, active, resolvedLocale),
  );
}

export async function deleteSiteReviewAdminAction(
  id: string,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.siteReviews.deleteFailed",
    () => deleteSiteReviewAdminService(id, resolvedLocale),
  );
}
