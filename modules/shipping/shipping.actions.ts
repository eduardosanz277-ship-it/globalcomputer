"use server";

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
  ShippingRateInput,
  ShippingSettingsInput,
} from "./shipping.types";

export async function updateShippingSettingsAdminAction(
  raw: ShippingSettingsInput,
) {
  const parsed = shippingSettingsFormSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }
  return updateShippingSettingsAdminService(parsed.data);
}

export async function createShippingRateAdminAction(raw: ShippingRateInput) {
  const parsed = shippingRateFormSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }
  return createShippingRateAdminService(parsed.data);
}

export async function updateShippingRateAdminAction(
  id: string,
  raw: ShippingRateInput,
) {
  if (!id?.trim()) throw new Error("Identificador inválido");
  const parsed = shippingRateFormSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }
  return updateShippingRateAdminService(id, parsed.data);
}

export async function deleteShippingRateAdminAction(id: string) {
  if (!id?.trim()) throw new Error("Identificador inválido");
  await deleteShippingRateAdminService(id);
}

export async function setShippingRateActiveAdminAction(
  id: string,
  active: boolean,
) {
  if (!id?.trim()) throw new Error("Identificador inválido");
  return setShippingRateActiveAdminService(id, active);
}
