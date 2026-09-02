import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import type { UserRole } from "@/modules/auth/auth.types";
import {
  repoDeleteProductReviewAdmin,
  repoListProductReviewsAdmin,
  repoUpdateProductReviewActiveAdmin,
} from "./product-reviews.repository";
import type { AdminProductReview } from "./product-reviews.types";

function ensureAdmin(role?: UserRole) {
  if (role !== "ADMIN") {
    throw new Error("Acceso restringido a administradores");
  }
}

export async function listProductReviewsAdminService(): Promise<
  AdminProductReview[]
> {
  const current = await getCurrentUserStrictService();
  ensureAdmin(current?.role);
  return repoListProductReviewsAdmin();
}

export async function updateProductReviewActiveAdminService(
  id: string,
  active: boolean,
): Promise<void> {
  const current = await getCurrentUserStrictService();
  ensureAdmin(current?.role);
  await repoUpdateProductReviewActiveAdmin(id, active);
}

export async function deleteProductReviewAdminService(id: string): Promise<void> {
  const current = await getCurrentUserStrictService();
  ensureAdmin(current?.role);
  await repoDeleteProductReviewAdmin(id);
}
