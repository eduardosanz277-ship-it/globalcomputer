"use client";

import { useI18n } from "@/components/i18n/I18nProvider";

export function OrdersErrorState({ message }: { message: string }) {
  const { t } = useI18n();
  const details = message.trim() || t("admin.orders.error.default");

  return (
    <div className="w-full space-y-4 rounded-2xl border border-destructive/60 bg-destructive/10 p-6 text-sm text-destructive-foreground">
      <h1 className="text-xl font-semibold text-destructive">
        {t("admin.orders.title")}
      </h1>
      <p>
        {details}. {t("admin.orders.error.hint")}
      </p>
    </div>
  );
}
