import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import {
  ensureAdminAccess,
  mapAdminEntityDbError,
  resolveAdminLocale,
} from "@/modules/admin/admin-errors";
import {
  repoDeleteProductReviewAdmin,
  repoListProductReviewsAdmin,
  repoUpdateProductReviewActiveAdmin,
} from "./product-reviews.repository";
import type { AdminProductReview } from "./product-reviews.types";

export async function listProductReviewsAdminService(
  localeInput?: unknown,
): Promise<AdminProductReview[]> {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  return repoListProductReviewsAdmin();
}

export async function updateProductReviewActiveAdminService(
  id: string,
  active: boolean,
  localeInput?: unknown,
): Promise<void> {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  try {
    await repoUpdateProductReviewActiveAdmin(id, active);
  } catch (e) {
    throw mapAdminEntityDbError(e, locale, "productReviews", "toggleFailed");
  }
}

export async function deleteProductReviewAdminService(
  id: string,
  localeInput?: unknown,
): Promise<void> {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  try {
    await repoDeleteProductReviewAdmin(id);
  } catch (e) {
    throw mapAdminEntityDbError(e, locale, "productReviews", "deleteFailed");
  }
}
