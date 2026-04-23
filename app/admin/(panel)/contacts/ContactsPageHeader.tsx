"use client";

import { useI18n } from "@/components/i18n/I18nProvider";

export function ContactsPageHeader() {
  const { t } = useI18n();

  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-semibold text-foreground">
        {t("admin.contacts.title")}
      </h1>
      <p className="text-sm text-muted-foreground">
        {t("admin.contacts.description")}
      </p>
    </header>
  );
}
