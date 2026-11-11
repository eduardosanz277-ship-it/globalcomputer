"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import type { ReactNode } from "react";

/**
 * Renders `en` content when locale is English, otherwise `es` content.
 * Accepts any ReactNode (JSX) unlike LocalizedText which only accepts strings.
 */
export function LocalizedContent({
  es,
  en,
}: {
  es: ReactNode;
  en?: ReactNode | null;
}) {
  const { locale } = useI18n();
  if (locale === "en" && en != null) return <>{en}</>;
  return <>{es}</>;
}
