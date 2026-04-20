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

export async function createFaqAdminAction(values: FaqAdminInsert) {
  await createFaqAdminService(values);
}

export async function updateFaqAdminAction(id: string, values: FaqAdminUpdate) {
  await updateFaqAdminService(id, values);
}

export async function deleteFaqAdminAction(id: string) {
  await deleteFaqAdminService(id);
}
