"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { useEffect } from "react";

/** Pestaña del navegador para `/brands` según el idioma activo. */
export function StorefrontBrandsHubDocumentTitle() {
  const { locale } = useI18n();

  useEffect(() => {
    const line = locale === "en" ? "Shop by brand" : "Comprar por marca";
    document.title = `${line} | Global Computers USA`;
  }, [locale]);

  return null;
}
