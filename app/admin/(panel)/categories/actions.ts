"use server";

import {
  createCategoryAdminService,
  softDeleteCategoryAdminService,
  updateCategoryAdminService,
} from "@/modules/admin/categories/categories.service";
import type {
  CategoryAdminInsert,
  CategoryAdminUpdate,
} from "@/modules/admin/categories/categories.types";

export async function createCategoryAdminAction(values: CategoryAdminInsert) {
  await createCategoryAdminService(values);
}

export async function updateCategoryAdminAction(
  id: string,
  values: CategoryAdminUpdate,
) {
  await updateCategoryAdminService(id, values);
}

export async function softDeleteCategoryAdminAction(id: string) {
  await softDeleteCategoryAdminService(id);
}
