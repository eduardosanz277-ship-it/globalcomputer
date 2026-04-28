import {
  DEFAULT_LOCALE,
  translations,
  type Locale,
} from "@/components/i18n/translations";

/** Resolución de claves `a.b.c` igual que `useI18n().t` (con fallback al locale por defecto). */
export function translate(locale: Locale, key: string): string {
  const segments = key.split(".");
  let current: unknown = translations[locale];
  for (const segment of segments) {
    if (typeof current !== "object" || current === null) {
      return key;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  if (typeof current === "string") return current;

  let fallback: unknown = translations[DEFAULT_LOCALE];
  for (const segment of segments) {
    if (typeof fallback !== "object" || fallback === null) {
      return key;
    }
    fallback = (fallback as Record<string, unknown>)[segment];
  }
  return typeof fallback === "string" ? fallback : key;
}
