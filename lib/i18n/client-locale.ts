import { parseAppLocale } from "@/lib/i18n/parse-locale";
import { setClientLocaleCookie } from "@/lib/i18n/locale-cookie";
import type { Locale } from "@/components/i18n/translations";

const LOCALE_STORAGE_KEY = "gc:locale";

/**
 * Locale real de la UI en el navegador.
 * Prioriza `localStorage` (fuente de verdad del `I18nProvider`) sobre el valor
 * de React que a veces aún refleja el SSR (`es`) antes de hidratar.
 */
export function resolveClientLocale(fallback?: string | null): Locale {
  if (typeof window === "undefined") {
    return parseAppLocale(fallback);
  }
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    const locale = parseAppLocale(stored ?? fallback);
    setClientLocaleCookie(locale);
    return locale;
  } catch {
    return parseAppLocale(fallback);
  }
}
