import { updateTag } from "next/cache";
import type { Locale } from "@/components/i18n/translations";
import { formatServerErrorMessage } from "@/lib/errors/format-server-error";
import { CATALOG_CACHE_TAG } from "@/lib/supabaseCatalogClient";

export type ServerActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; message: string };

export async function runServerAction<T>(
  locale: Locale,
  fallbackKey: string,
  fn: () => Promise<T>,
): Promise<ServerActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (e: unknown) {
    return {
      ok: false,
      message: formatServerErrorMessage(e, locale, fallbackKey),
    };
  }
}

/**
 * Igual que `runServerAction` para mutaciones del catálogo desde el admin:
 * si tiene éxito, invalida la caché pública (`withCatalogCache`) al momento.
 */
export async function runCatalogServerAction<T>(
  locale: Locale,
  fallbackKey: string,
  fn: () => Promise<T>,
): Promise<ServerActionResult<T>> {
  const result = await runServerAction(locale, fallbackKey, fn);
  if (result.ok) updateTag(CATALOG_CACHE_TAG);
  return result;
}
