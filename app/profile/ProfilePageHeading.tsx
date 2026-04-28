"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { useEffect } from "react";

/** Cabecera reactiva al idioma (el servidor solo envía el SSR inicial). */
export function ProfilePageHeading() {
  const { locale, t } = useI18n();

  useEffect(() => {
    document.title = t("profile.metaTitle");
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", t("profile.metaDescription"));
    }
  }, [locale, t]);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("profile.heading")}
      </h1>
      <p className="text-sm text-muted-foreground">{t("profile.subtitle")}</p>
    </div>
  );
}
