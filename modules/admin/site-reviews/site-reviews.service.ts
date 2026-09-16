import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import {
  ensureAdminAccess,
  mapAdminEntityDbError,
  resolveAdminLocale,
} from "@/modules/admin/admin-errors";
import {
  repoDeleteSiteReviewAdmin,
  repoListSiteReviewsAdmin,
  repoUpdateSiteReviewActiveAdmin,
} from "./site-reviews.repository";
import type { AdminSiteReview } from "./site-reviews.types";

export async function listSiteReviewsAdminService(
  localeInput?: unknown,
): Promise<AdminSiteReview[]> {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  return repoListSiteReviewsAdmin();
}

export async function updateSiteReviewActiveAdminService(
  id: string,
  active: boolean,
  localeInput?: unknown,
): Promise<void> {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  try {
    await repoUpdateSiteReviewActiveAdmin(id, active);
  } catch (e) {
    throw mapAdminEntityDbError(e, locale, "siteReviews", "toggleFailed");
  }
}

export async function deleteSiteReviewAdminService(
  id: string,
  localeInput?: unknown,
): Promise<void> {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  try {
    await repoDeleteSiteReviewAdmin(id);
  } catch (e) {
    throw mapAdminEntityDbError(e, locale, "siteReviews", "deleteFailed");
  }
}
