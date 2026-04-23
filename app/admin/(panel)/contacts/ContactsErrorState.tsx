"use client";

import { useI18n } from "@/components/i18n/I18nProvider";

export function ContactsErrorState({ message }: { message: string }) {
  const { t } = useI18n();
  const details = message.trim() || t("admin.contacts.error.default");

  return (
    <div className="w-full space-y-4 rounded-2xl border border-destructive/60 bg-destructive/10 p-6 text-sm text-destructive-foreground">
      <h2 className="text-xl font-semibold text-destructive">
        {t("admin.contacts.title")}
      </h2>
      <p>
        {details}. {t("admin.contacts.error.hint")}
      </p>
    </div>
  );
}
