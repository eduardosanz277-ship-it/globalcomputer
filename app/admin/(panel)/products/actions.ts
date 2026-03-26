"use server";

import {
  createProductService,
  deleteProductService,
  updateProductService,
} from "@/modules/admin/products/products.service";
import type {
  ExistingProductImageOutput,
  ProductCharacteristicValueInput,
  ProductInsert,
  ProductUpdate,
} from "@/modules/admin/products/products.types";

export async function createProductAction(values: ProductInsert) {
  await createProductService(values);
}

export async function updateProductAction(id: string, values: ProductUpdate) {
  await updateProductService(id, values);
}

export async function deleteProductAction(id: string) {
  await deleteProductService(id);
}

export async function createProductWithImageAction(
  values: ProductInsert,
  imageFiles?: File[],
  primaryImageIndex?: number,
  characteristicValues?: ProductCharacteristicValueInput[],
  manualPdfFile?: File | null,
) {
  await createProductService(
    values,
    imageFiles,
    primaryImageIndex ?? 0,
    characteristicValues,
    manualPdfFile,
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
) {
  await updateProductService(
    id,
    values,
    imageFiles,
    primaryImageIndex ?? 0,
    updatedExistingImages,
    removedImageIds,
    characteristicValues,
    manualPdfFile,
  );
}