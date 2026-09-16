import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import {
  ensureAdminAccess,
  mapAdminEntityDbError,
  resolveAdminLocale,
  shippingRateOverlapError,
} from "@/modules/admin/admin-errors";
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
  ShippingQuoteOfferInput,
  ShippingRate,
  ShippingRateInput,
  ShippingSettings,
  ShippingSettingsInput,
} from "./shipping.types";

export async function getShippingSettingsService(): Promise<ShippingSettings> {
  return repoGetShippingSettings();
}

export async function getShippingSettingsAdminService(
  localeInput?: unknown,
): Promise<ShippingSettings> {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  return repoGetShippingSettings();
}

export async function updateShippingSettingsAdminService(
  input: ShippingSettingsInput,
  localeInput?: unknown,
): Promise<ShippingSettings> {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  try {
    return await repoUpdateShippingSettings(input);
  } catch (e) {
    throw mapAdminEntityDbError(e, locale, "shippingSettings", "saveFailed");
  }
}

export async function listShippingRatesAdminService(
  localeInput?: unknown,
): Promise<ShippingRate[]> {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  return repoListShippingRates();
}

export async function listActiveShippingRatesService(): Promise<ShippingRate[]> {
  return repoListShippingRates({ activeOnly: true });
}

export async function createShippingRateAdminService(
  input: ShippingRateInput,
  localeInput?: unknown,
): Promise<ShippingRate> {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  const existing = await repoListShippingRates();
  const overlap = findOverlappingRate(input, existing);
  if (overlap) {
    throw shippingRateOverlapError(
      locale,
      overlap.minAmount,
      overlap.maxAmount,
    );
  }
  try {
    return await repoCreateShippingRate(input);
  } catch (e) {
    throw mapAdminEntityDbError(e, locale, "shippingRates", "createFailed");
  }
}

export async function updateShippingRateAdminService(
  id: string,
  input: ShippingRateInput,
  localeInput?: unknown,
): Promise<ShippingRate> {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  const existing = await repoListShippingRates();
  const overlap = findOverlappingRate(input, existing, id);
  if (overlap) {
    throw shippingRateOverlapError(
      locale,
      overlap.minAmount,
      overlap.maxAmount,
    );
  }
  try {
    return await repoUpdateShippingRate(id, input);
  } catch (e) {
    throw mapAdminEntityDbError(e, locale, "shippingRates", "updateFailed");
  }
}

export async function deleteShippingRateAdminService(
  id: string,
  localeInput?: unknown,
): Promise<void> {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  try {
    await repoDeleteShippingRate(id);
  } catch (e) {
    throw mapAdminEntityDbError(e, locale, "shippingRates", "deleteFailed");
  }
}

export async function setShippingRateActiveAdminService(
  id: string,
  active: boolean,
  localeInput?: unknown,
): Promise<ShippingRate> {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  try {
    return await repoSetShippingRateActive(id, active);
  } catch (e) {
    throw mapAdminEntityDbError(e, locale, "shippingRates", "toggleFailed");
  }
}

export async function quoteShippingService(input: {
  subtotal: number;
  lines: ShippingQuoteLineInput[];
  offer?: ShippingQuoteOfferInput | null;
  locale?: string | null;
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
    offer: input.offer,
    locale: input.locale,
  });
}
