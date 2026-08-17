import type { Locale } from "@/components/i18n/translations";
import { DEFAULT_LOCALE } from "@/components/i18n/translations";

function normalizeLocaleToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase();
  if (!v || v === "auto") return null;
  return v;
}

/** `en` | `es` si el valor es reconocible; si no, `null` (no usa el default). */
export function recognizedAppLocale(value: unknown): Locale | null {
  const v = normalizeLocaleToken(value);
  if (!v) return null;
  if (v === "en" || v.startsWith("en-")) return "en";
  if (v === "es" || v.startsWith("es-")) return "es";
  return null;
}

/**
 * Normaliza un valor desconocido a `es` | `en`.
 * Acepta prefijos de Stripe/BCP-47 (`en`, `en-US`, `es-419`, etc.).
 * `auto` (Stripe) no cuenta como español.
 */
export function parseAppLocale(value: unknown): Locale {
  return recognizedAppLocale(value) ?? DEFAULT_LOCALE;
}

/** Primera fuente reconocible; si ninguna vale, `DEFAULT_LOCALE`. */
export function resolveAppLocale(...candidates: Array<unknown>): Locale {
  for (const candidate of candidates) {
    const parsed = recognizedAppLocale(candidate);
    if (parsed) return parsed;
  }
  return DEFAULT_LOCALE;
}
