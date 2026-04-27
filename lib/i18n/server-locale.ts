import { cookies, headers } from "next/headers";
import type { Locale } from "@/components/i18n/translations";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/components/i18n/translations";
import { GC_LOCALE_COOKIE_NAME, parseLocaleCookieValue } from "@/lib/i18n/locale-cookie";

export type ServerLocale = Locale;

/**
 * Locale para RSC, `generateMetadata` y textos SSR.
 * Orden: cookie (`gc_locale`, misma preferencia que `I18nProvider`) → primer idioma de `Accept-Language` → `es`.
 */
export async function getServerLocale(): Promise<ServerLocale> {
  const cookieStore = await cookies();
  const fromCookie = parseLocaleCookieValue(cookieStore.get(GC_LOCALE_COOKIE_NAME)?.value);
  if (fromCookie && SUPPORTED_LOCALES.includes(fromCookie)) {
    return fromCookie;
  }

  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language")?.toLowerCase() ?? "";
  const primary = acceptLanguage.split(",")[0]?.trim() ?? "";
  if (primary.startsWith("en")) return "en";

  return DEFAULT_LOCALE;
}
