"use server";

import {
  deleteSiteReviewAdminService,
  updateSiteReviewActiveAdminService,
} from "./site-reviews.service";

export async function updateSiteReviewActiveAdminAction(
  id: string,
  active: boolean,
) {
  await updateSiteReviewActiveAdminService(id, active);
}

export async function deleteSiteReviewAdminAction(id: string) {
  await deleteSiteReviewAdminService(id);
}
