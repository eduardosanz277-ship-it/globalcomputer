"use server";

import {
  createServiceService,
  deleteServiceService,
  updateServiceService,
} from "@/modules/admin/services/services.service";
import type {
  ExistingServiceImageOutput,
  ServiceBannerFiles,
  ServiceBannerRemovals,
  ServiceInsert,
  ServiceUpdate,
} from "@/modules/admin/services/services.types";
import {
  runServerAction,
  type ServerActionResult,
} from "@/lib/errors/run-server-action";
import { resolveAdminLocale } from "@/modules/admin/admin-errors";

export async function createServiceAction(
  values: ServiceInsert,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.services.createFailed",
    () => createServiceService(values, undefined, 0, undefined, resolvedLocale),
  );
}

export async function updateServiceAction(
  id: string,
  values: ServiceUpdate,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.services.updateFailed",
    () => updateServiceService(id, values, undefined, 0, undefined, undefined, undefined, undefined, resolvedLocale),
  );
}

export async function deleteServiceAction(
  id: string,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.services.deleteFailed",
    () => deleteServiceService(id, resolvedLocale),
  );
}

export async function createServiceWithImageAction(
  values: ServiceInsert,
  imageFiles?: File[],
  primaryImageIndex?: number,
  bannerFiles?: ServiceBannerFiles,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.services.createFailed",
    () =>
      createServiceService(
        values,
        imageFiles,
        primaryImageIndex ?? 0,
        bannerFiles,
        resolvedLocale,
      ),
  );
}

export async function updateServiceWithImageAction(
  id: string,
  values: ServiceUpdate,
  imageFiles?: File[],
  primaryImageIndex?: number,
  updatedExistingImages?: ExistingServiceImageOutput[],
  removedImageIds?: string[],
  bannerFiles?: ServiceBannerFiles,
  bannerRemovals?: ServiceBannerRemovals,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.services.updateFailed",
    () =>
      updateServiceService(
        id,
        values,
        imageFiles,
        primaryImageIndex ?? 0,
        updatedExistingImages,
        removedImageIds,
        bannerFiles,
        bannerRemovals,
        resolvedLocale,
      ),
  );
}
