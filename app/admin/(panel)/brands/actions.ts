"use server";

import {
  createBrandService,
  deleteBrandService,
  updateBrandService,
} from "@/modules/admin/brands/brands.service";
import type { BrandInsert, BrandUpdate } from "@/modules/admin/brands/brands.types";

export async function createBrandAction(values: BrandInsert) {
  await createBrandService(values);
}

export async function updateBrandAction(id: string, values: BrandUpdate) {
  await updateBrandService(id, values);
}

export async function deleteBrandAction(id: string) {
  await deleteBrandService(id);
}
