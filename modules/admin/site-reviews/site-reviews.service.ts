import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import type { UserRole } from "@/modules/auth/auth.types";
import {
  repoDeleteSiteReviewAdmin,
  repoListSiteReviewsAdmin,
  repoUpdateSiteReviewActiveAdmin,
} from "./site-reviews.repository";
import type { AdminSiteReview } from "./site-reviews.types";

function ensureAdmin(role?: UserRole) {
  if (role !== "ADMIN") {
    throw new Error("Acceso restringido a administradores");
  }
}

export async function listSiteReviewsAdminService(): Promise<AdminSiteReview[]> {
  const current = await getCurrentUserStrictService();
  ensureAdmin(current?.role);
  return repoListSiteReviewsAdmin();
}

export async function updateSiteReviewActiveAdminService(
  id: string,
  active: boolean,
): Promise<void> {
  const current = await getCurrentUserStrictService();
  ensureAdmin(current?.role);
  await repoUpdateSiteReviewActiveAdmin(id, active);
}

export async function deleteSiteReviewAdminService(id: string): Promise<void> {
  const current = await getCurrentUserStrictService();
  ensureAdmin(current?.role);
  await repoDeleteSiteReviewAdmin(id);
}
