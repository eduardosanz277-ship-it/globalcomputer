"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { useEffect } from "react";

/** Pestaña del navegador para `/security-system` según traducciones de la sección. */
export function StorefrontSecurityHubDocumentTitle() {
  const { t } = useI18n();

  useEffect(() => {
    const section = t("common.nav.securitySystems");
    document.title = `${section} | Global Computers USA`;
  }, [t]);

  return null;
}
