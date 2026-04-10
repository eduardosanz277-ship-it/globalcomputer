"use server";

import {
  createSubcategoryAdminService,
  softDeleteSubcategoryAdminService,
  updateSubcategoryAdminService,
} from "@/modules/admin/subcategories/subcategories.service";
import type {
  SubcategoryAdminInsert,
  SubcategoryAdminUpdate,
} from "@/modules/admin/subcategories/subcategories.types";

export async function createSubcategoryAdminAction(
  values: SubcategoryAdminInsert,
) {
  await createSubcategoryAdminService(values);
}

export async function updateSubcategoryAdminAction(
  id: string,
  values: SubcategoryAdminUpdate,
) {
  await updateSubcategoryAdminService(id, values);
}

export async function softDeleteSubcategoryAdminAction(id: string) {
  await softDeleteSubcategoryAdminService(id);
}
