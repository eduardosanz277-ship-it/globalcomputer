"use server";

import {
  createProductService,
  deleteProductService,
  updateProductService,
} from "@/modules/admin/products/products.service";
import type {
  ExistingProductImageOutput,
  ProductAccessoryInput,
  ProductCharacteristicValueInput,
  ProductInsert,
  ProductUpdate,
} from "@/modules/admin/products/products.types";
import {
  runServerAction,
  type ServerActionResult,
} from "@/lib/errors/run-server-action";
import { resolveAdminLocale } from "@/modules/admin/admin-errors";

export async function createProductAction(
  values: ProductInsert,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.products.createFailed",
    () => createProductService(values, undefined, 0, undefined, null, undefined, resolvedLocale),
  );
}

export async function updateProductAction(
  id: string,
  values: ProductUpdate,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.products.updateFailed",
    () => updateProductService(id, values, undefined, 0, undefined, undefined, undefined, null, undefined, resolvedLocale),
  );
}

export async function deleteProductAction(
  id: string,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.products.deleteFailed",
    () => deleteProductService(id, resolvedLocale),
  );
}

export async function createProductWithImageAction(
  values: ProductInsert,
  imageFiles?: File[],
  primaryImageIndex?: number,
  characteristicValues?: ProductCharacteristicValueInput[],
  manualPdfFile?: File | null,
  accessories?: ProductAccessoryInput[],
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.products.createFailed",
    () =>
      createProductService(
        values,
        imageFiles,
        primaryImageIndex ?? 0,
        characteristicValues,
        manualPdfFile,
        accessories,
        resolvedLocale,
      ),
  );
}

export async function updateProductWithImageAction(
  id: string,
  values: ProductUpdate,
  imageFiles?: File[],
  primaryImageIndex?: number,
  updatedExistingImages?: ExistingProductImageOutput[],
  removedImageIds?: string[],
  characteristicValues?: ProductCharacteristicValueInput[],
  manualPdfFile?: File | null,
  accessories?: ProductAccessoryInput[],
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.products.updateFailed",
    () =>
      updateProductService(
        id,
        values,
        imageFiles,
        primaryImageIndex ?? 0,
        updatedExistingImages,
        removedImageIds,
        characteristicValues,
        manualPdfFile,
        accessories,
        resolvedLocale,
      ),
  );
}
