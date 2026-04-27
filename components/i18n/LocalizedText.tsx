"use client";

import { useI18n } from "@/components/i18n/I18nProvider";

export function LocalizedText({
  es,
  en,
}: {
  es: string;
  en?: string | null;
}) {
  const { locale } = useI18n();
  if (locale === "en") return en?.trim() || es;
  return es;
}
