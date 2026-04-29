"use server";

import {
  deleteProductReviewAdminService,
  updateProductReviewActiveAdminService,
} from "./product-reviews.service";

export async function updateProductReviewActiveAdminAction(
  id: string,
  active: boolean,
) {
  await updateProductReviewActiveAdminService(id, active);
}

export async function deleteProductReviewAdminAction(id: string) {
  await deleteProductReviewAdminService(id);
}
