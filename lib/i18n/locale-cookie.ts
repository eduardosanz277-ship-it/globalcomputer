import type { Locale } from "@/components/i18n/translations";

/** Cookie leída por `getServerLocale()` y escrita desde el cliente al cambiar idioma. */
export const GC_LOCALE_COOKIE_NAME = "gc_locale";

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;

export function parseLocaleCookieValue(
  raw: string | undefined | null,
): Locale | null {
  if (raw == null || typeof raw !== "string") return null;
  const v = raw.trim();
  if (v === "es" || v === "en") return v;
  return null;
}

/** Persiste el locale para que los Server Components coincidan con la UI en la siguiente petición. */
export function setClientLocaleCookie(locale: Locale): void {
  if (typeof document === "undefined") return;
  document.cookie = `${GC_LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${COOKIE_MAX_AGE_SEC}; samesite=lax`;
}
