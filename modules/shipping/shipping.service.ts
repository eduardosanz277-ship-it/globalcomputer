import { getCurrentUserService } from "@/modules/auth/auth.service";
import type { UserRole } from "@/modules/auth/auth.types";
import { calculateShipping } from "./shipping.calculator";
import { findOverlappingRate } from "./shipping.calculator";
import {
  repoCreateShippingRate,
  repoDeleteShippingRate,
  repoListShippingRates,
  repoSetShippingRateActive,
  repoUpdateShippingRate,
} from "./shipping-rates.repository";
import {
  repoGetShippingSettings,
  repoUpdateShippingSettings,
} from "./shipping-settings.repository";
import type {
  ShippingQuote,
  ShippingQuoteLineInput,
  ShippingRate,
  ShippingRateInput,
  ShippingSettings,
  ShippingSettingsInput,
} from "./shipping.types";

function ensureAdmin(role?: UserRole) {
  if (role !== "ADMIN") {
    throw new Error("Acceso restringido a administradores");
  }
}

export async function getShippingSettingsService(): Promise<ShippingSettings> {
  return repoGetShippingSettings();
}

export async function getShippingSettingsAdminService(): Promise<ShippingSettings> {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  return repoGetShippingSettings();
}

export async function updateShippingSettingsAdminService(
  input: ShippingSettingsInput,
): Promise<ShippingSettings> {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  return repoUpdateShippingSettings(input);
}

export async function listShippingRatesAdminService(): Promise<ShippingRate[]> {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  return repoListShippingRates();
}

export async function listActiveShippingRatesService(): Promise<ShippingRate[]> {
  return repoListShippingRates({ activeOnly: true });
}

export async function createShippingRateAdminService(
  input: ShippingRateInput,
): Promise<ShippingRate> {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  const existing = await repoListShippingRates();
  const overlap = findOverlappingRate(input, existing);
  if (overlap) {
    throw new Error(
      `El rango se solapa con la tarifa ${overlap.minAmount} – ${overlap.maxAmount}`,
    );
  }
  return repoCreateShippingRate(input);
}

export async function updateShippingRateAdminService(
  id: string,
  input: ShippingRateInput,
): Promise<ShippingRate> {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  const existing = await repoListShippingRates();
  const overlap = findOverlappingRate(input, existing, id);
  if (overlap) {
    throw new Error(
      `El rango se solapa con la tarifa ${overlap.minAmount} – ${overlap.maxAmount}`,
    );
  }
  return repoUpdateShippingRate(id, input);
}

export async function deleteShippingRateAdminService(id: string): Promise<void> {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  await repoDeleteShippingRate(id);
}

export async function setShippingRateActiveAdminService(
  id: string,
  active: boolean,
): Promise<ShippingRate> {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  return repoSetShippingRateActive(id, active);
}

export async function quoteShippingService(input: {
  subtotal: number;
  lines: ShippingQuoteLineInput[];
}): Promise<ShippingQuote> {
  const [settings, rates] = await Promise.all([
    repoGetShippingSettings(),
    repoListShippingRates({ activeOnly: true }),
  ]);
  return calculateShipping({
    subtotal: input.subtotal,
    lines: input.lines,
    settings,
    rates,
  });
}
