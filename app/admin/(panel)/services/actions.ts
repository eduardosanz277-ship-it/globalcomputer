"use server";

import {
  createServiceService,
  deleteServiceService,
  updateServiceService,
} from "@/modules/admin/services/services.service";
import type {
  ExistingServiceImageOutput,
  ServiceInsert,
  ServiceUpdate,
} from "@/modules/admin/services/services.types";

export async function createServiceAction(values: ServiceInsert) {
  await createServiceService(values);
}

export async function updateServiceAction(id: string, values: ServiceUpdate) {
  await updateServiceService(id, values);
}

export async function deleteServiceAction(id: string) {
  await deleteServiceService(id);
}

export async function createServiceWithImageAction(
  values: ServiceInsert,
  imageFiles?: File[],
  primaryImageIndex?: number
) {
  await createServiceService(values, imageFiles, primaryImageIndex ?? 0);
}

export async function updateServiceWithImageAction(
  id: string,
  values: ServiceUpdate,
  imageFiles?: File[],
  primaryImageIndex?: number,
  updatedExistingImages?: ExistingServiceImageOutput[],
  removedImageIds?: string[]
) {
  await updateServiceService(
    id,
    values,
    imageFiles,
    primaryImageIndex ?? 0,
    updatedExistingImages,
    removedImageIds
  );
}
