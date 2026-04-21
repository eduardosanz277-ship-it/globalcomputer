"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  translations,
} from "@/components/i18n/translations";
import type { Locale } from "@/components/i18n/translations";

const STORAGE_KEY = "gc:locale";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  supportedLocales: Locale[];
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
      setLocaleState(stored as Locale);
      return;
    }
    const preferred = window.navigator.language.startsWith("en") ? "en" : "es";
    setLocaleState(preferred);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState((prev) => (prev === next ? prev : next));
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => (prev === "es" ? "en" : "es"));
  }, []);

  const t = useCallback(
    (key: string) => getTranslation(locale, key),
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      supportedLocales: SUPPORTED_LOCALES,
      t,
    }),
    [locale, setLocale, toggleLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

function getTranslation(locale: Locale, key: string): string {
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
