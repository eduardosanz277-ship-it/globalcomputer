import { es } from "@/components/i18n/locales/es";
import { en } from "@/components/i18n/locales/en";

export const translations = {
  es,
  en,
} as const;

export type Locale = keyof typeof translations;

export const SUPPORTED_LOCALES: Locale[] = ["es", "en"];
export const DEFAULT_LOCALE: Locale = "es";

export const LANGUAGE_LABEL_KEY: Record<Locale, string> = {
  es: "language.spanish",
  en: "language.english",
};
