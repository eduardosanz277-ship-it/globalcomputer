"use client";

import { useI18n } from "@/components/i18n/I18nProvider";

export function SettingsPageHeader() {
  const { t } = useI18n();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {t("admin.settings.title")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("admin.settings.description")}
      </p>
    </div>
  );
}
