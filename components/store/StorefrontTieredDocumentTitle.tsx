"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { storefrontLocalizedText } from "@/modules/catalog/storefront-product.shared";
import { useEffect } from "react";

type Props = {
  primaryName: string;
  primaryNameEn: string | null;
  secondaryName?: string;
  secondaryNameEn?: string | null;
};

/** Título de pestaña: nivel primario (± secundario) + “Catálogo” según locale, alineado con la BD. */
export function StorefrontTieredDocumentTitle({
  primaryName,
  primaryNameEn,
  secondaryName,
  secondaryNameEn,
}: Props) {
  const { locale } = useI18n();

  useEffect(() => {
    const primary = storefrontLocalizedText(locale, primaryName, primaryNameEn);
    const catalogLabel = locale === "en" ? "Catalog" : "Catálogo";
    const suffix = "Global Computers USA";
    const line =
      secondaryName != null && secondaryName !== ""
        ? `${primary} — ${storefrontLocalizedText(locale, secondaryName, secondaryNameEn)} | ${catalogLabel}`
        : `${primary} | ${catalogLabel}`;
    document.title = `${line} | ${suffix}`;
  }, [locale, primaryName, primaryNameEn, secondaryName, secondaryNameEn]);

  return null;
}
