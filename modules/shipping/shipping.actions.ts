"use server";

import {
  adminInvalidDataError,
  resolveAdminLocale,
} from "@/modules/admin/admin-errors";
import {
  runServerAction,
  type ServerActionResult,
} from "@/lib/errors/run-server-action";
import {
  createShippingRateAdminService,
  deleteShippingRateAdminService,
  setShippingRateActiveAdminService,
  updateShippingRateAdminService,
  updateShippingSettingsAdminService,
} from "./shipping.service";
import {
  shippingRateFormSchema,
  shippingSettingsFormSchema,
} from "./shipping.schema";
import type {
  ShippingRate,
  ShippingRateInput,
  ShippingSettings,
  ShippingSettingsInput,
} from "./shipping.types";

export async function updateShippingSettingsAdminAction(
  raw: ShippingSettingsInput,
  locale?: string,
): Promise<ServerActionResult<ShippingSettings>> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.shippingSettings.saveFailed",
    async () => {
      const parsed = shippingSettingsFormSchema.safeParse(raw);
      if (!parsed.success) {
        throw adminInvalidDataError(
          resolvedLocale,
          parsed.error.issues[0]?.message,
        );
      }
      return updateShippingSettingsAdminService(parsed.data, resolvedLocale);
    },
  );
}

export async function createShippingRateAdminAction(
  raw: ShippingRateInput,
  locale?: string,
): Promise<ServerActionResult<ShippingRate>> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.shippingRates.createFailed",
    async () => {
      const parsed = shippingRateFormSchema.safeParse(raw);
      if (!parsed.success) {
        throw adminInvalidDataError(
          resolvedLocale,
          parsed.error.issues[0]?.message,
        );
      }
      return createShippingRateAdminService(parsed.data, resolvedLocale);
    },
  );
}

export async function updateShippingRateAdminAction(
  id: string,
  raw: ShippingRateInput,
  locale?: string,
): Promise<ServerActionResult<ShippingRate>> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.shippingRates.updateFailed",
    async () => {
      if (!id?.trim()) {
        throw adminInvalidDataError(resolvedLocale);
      }
      const parsed = shippingRateFormSchema.safeParse(raw);
      if (!parsed.success) {
        throw adminInvalidDataError(
          resolvedLocale,
          parsed.error.issues[0]?.message,
        );
      }
      return updateShippingRateAdminService(id, parsed.data, resolvedLocale);
    },
  );
}

export async function deleteShippingRateAdminAction(
  id: string,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.shippingRates.deleteFailed",
    async () => {
      if (!id?.trim()) {
        throw adminInvalidDataError(resolvedLocale);
      }
      await deleteShippingRateAdminService(id, resolvedLocale);
    },
  );
}

export async function setShippingRateActiveAdminAction(
  id: string,
  active: boolean,
  locale?: string,
): Promise<ServerActionResult<ShippingRate>> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.shippingRates.toggleFailed",
    async () => {
      if (!id?.trim()) {
        throw adminInvalidDataError(resolvedLocale);
      }
      return setShippingRateActiveAdminService(id, active, resolvedLocale);
    },
  );
}
