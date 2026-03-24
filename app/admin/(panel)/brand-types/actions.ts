"use server";

import {
  createBrandTypeService,
  deleteBrandTypeService,
  updateBrandTypeService,
} from "@/modules/admin/brand-types/brand-types.service";
import type {
  BrandTypeInsert,
  BrandTypeUpdate,
} from "@/modules/admin/brand-types/brand-types.types";

export async function createBrandTypeAction(values: BrandTypeInsert) {
  await createBrandTypeService(values);
}

export async function updateBrandTypeAction(id: string, values: BrandTypeUpdate) {
  await updateBrandTypeService(id, values);
}

export async function deleteBrandTypeAction(id: string) {
  await deleteBrandTypeService(id);
}
