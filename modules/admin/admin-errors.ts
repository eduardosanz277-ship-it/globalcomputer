import type { Locale } from "@/components/i18n/translations";
import { translate } from "@/lib/i18n/get-translation";
import { recognizedAppLocale } from "@/lib/i18n/parse-locale";
import { getServerLocale } from "@/lib/i18n/server-locale";
import type { UserRole } from "@/modules/auth/auth.types";

export type AdminEntityKey =
  | "categories"
  | "subcategories"
  | "brands"
  | "brandTypes"
  | "generalCharacteristics"
  | "specificCharacteristics"
  | "faqs"
  | "products"
  | "services"
  | "shippingSettings"
  | "shippingRates"
  | "settings"
  | "contacts"
  | "siteReviews"
  | "productReviews";

export type AdminEntityOperation =
  | "createFailed"
  | "updateFailed"
  | "deleteFailed"
  | "archiveFailed"
  | "saveFailed"
  | "toggleFailed"
  | "markReadFailed";

export async function resolveAdminLocale(
  localeInput?: unknown,
): Promise<Locale> {
  return (recognizedAppLocale(localeInput) ?? (await getServerLocale())) as Locale;
}

export function ensureAdminAccess(role: UserRole | undefined, locale: Locale): void {
  if (role !== "ADMIN") {
    throw new Error(translate(locale, "admin.errors.common.accessDenied"));
  }
}

export function adminInvalidDataError(
  locale: Locale,
  detail?: string | null,
): Error {
  return new Error(
    detail?.trim() || translate(locale, "admin.errors.common.invalidData"),
  );
}

function isDuplicateKeyError(message: string): boolean {
  return /duplicate key|23505|unique constraint/i.test(message);
}

function isForeignKeyError(message: string): boolean {
  return /foreign key|23503|violates/i.test(message);
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message.trim();
  return String(err ?? "").trim();
}

function getPostgresErrorCode(err: unknown): string | undefined {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code?: unknown }).code;
    if (typeof code === "string" && code.length > 0) return code;
  }
  return undefined;
}

export function mapAdminEntityDbError(
  err: unknown,
  locale: Locale,
  entity: AdminEntityKey,
  operation: AdminEntityOperation,
): Error {
  const msg = getErrorMessage(err);

  if (isDuplicateKeyError(msg)) {
    return new Error(translate(locale, `admin.errors.${entity}.duplicateName`));
  }

  if (isForeignKeyError(msg)) {
    const foreignKeyKey = `admin.errors.${entity}.foreignKey`;
    const translated = translate(locale, foreignKeyKey);
    if (translated !== foreignKeyKey) {
      return new Error(translated);
    }
  }

  if (err instanceof Error && msg) {
    return err;
  }

  return new Error(translate(locale, `admin.errors.${entity}.${operation}`));
}

export function mapProductAdminDbError(
  err: unknown,
  locale: Locale,
  operation: Extract<
    AdminEntityOperation,
    "createFailed" | "updateFailed" | "deleteFailed"
  >,
): Error {
  const msg = getErrorMessage(err);
  const code = getPostgresErrorCode(err);

  if (code === "23505" || isDuplicateKeyError(msg)) {
    if (/sku/i.test(msg)) {
      return new Error(translate(locale, "admin.errors.products.duplicateSku"));
    }
    return new Error(translate(locale, "admin.errors.products.duplicateData"));
  }
  if (code === "23503" || isForeignKeyError(msg)) {
    return new Error(translate(locale, "admin.errors.products.foreignKey"));
  }
  if (code === "23502" || /null value|not null/i.test(msg)) {
    return new Error(translate(locale, "admin.errors.products.missingRequired"));
  }
  if (code === "23514" || /check constraint/i.test(msg)) {
    return new Error(translate(locale, "admin.errors.products.validationFailed"));
  }
  if (code === "42501" || /permission denied|row-level security|RLS/i.test(msg)) {
    return new Error(translate(locale, "admin.errors.products.permissionDenied"));
  }

  return new Error(translate(locale, `admin.errors.products.${operation}`));
}

export function mapServiceAdminDbError(
  err: unknown,
  locale: Locale,
  operation: Extract<
    AdminEntityOperation,
    "createFailed" | "updateFailed" | "deleteFailed"
  >,
): Error {
  const msg = getErrorMessage(err);

  if (isForeignKeyError(msg)) {
    return new Error(translate(locale, "admin.errors.services.foreignKey"));
  }
  if (isDuplicateKeyError(msg)) {
    return new Error(translate(locale, "admin.errors.services.duplicatePrimary"));
  }

  return new Error(translate(locale, `admin.errors.services.${operation}`));
}

export function shippingRateOverlapError(
  locale: Locale,
  minAmount: number | string,
  maxAmount: number | string,
): Error {
  return new Error(
    translate(locale, "admin.errors.shippingRates.overlap")
      .replace("{min}", String(minAmount))
      .replace("{max}", String(maxAmount)),
  );
}

export function userAdminError(locale: Locale, key: string): Error {
  return new Error(translate(locale, `admin.errors.users.${key}`));
}

export function userAdminErrorWithDetail(
  locale: Locale,
  key: string,
  detail: string,
): Error {
  return new Error(
    translate(locale, `admin.errors.users.${key}`).replace("{detail}", detail),
  );
}
