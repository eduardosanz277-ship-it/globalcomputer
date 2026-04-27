"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  translations,
} from "@/components/i18n/translations";
import type { Locale } from "@/components/i18n/translations";
import { setClientLocaleCookie } from "@/lib/i18n/locale-cookie";

const STORAGE_KEY = "gc:locale";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  supportedLocales: Locale[];
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  /** Locale deducido en el servidor (cookie o Accept-Language); alinea SSR con el cliente. */
  initialLocale?: Locale;
}) {
  const router = useRouter();
  const resolvedInitial: Locale =
    initialLocale && SUPPORTED_LOCALES.includes(initialLocale)
      ? initialLocale
      : DEFAULT_LOCALE;

  const [locale, setLocaleState] = useState<Locale>(
    () =>
      initialLocale && SUPPORTED_LOCALES.includes(initialLocale)
        ? initialLocale
        : DEFAULT_LOCALE,
  );

  const persistLocale = useCallback((next: Locale) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, next);
    setClientLocaleCookie(next);
  }, []);

  /**
   * Al montar: respeta `localStorage` sin pisarlo con el locale del servidor.
   * Si la preferencia guardada difiere del SSR, cookie + refresh para alinear RSC.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const hasStored = raw && SUPPORTED_LOCALES.includes(raw as Locale);

    if (hasStored) {
      const storedLocale = raw as Locale;
      if (storedLocale !== resolvedInitial) {
        setLocaleState(storedLocale);
        setClientLocaleCookie(storedLocale);
        router.refresh();
        return;
      }
      setClientLocaleCookie(storedLocale);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, resolvedInitial);
    setClientLocaleCookie(resolvedInitial);
  }, [resolvedInitial, router]);

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState((prev) => {
        if (prev === next) return prev;
        persistLocale(next);
        return next;
      });
    },
    [persistLocale],
  );

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => {
      const next = prev === "es" ? "en" : "es";
      persistLocale(next);
      return next;
    });
  }, [persistLocale]);

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
