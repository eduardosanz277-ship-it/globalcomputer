"use client";

import { useI18n } from "@/components/i18n/I18nProvider";

export function ShippingGeneralPageHeader() {
  const { t } = useI18n();
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {t("admin.shipping.general.title")}
      </h1>
      <p className="text-sm text-muted-foreground">
        {t("admin.shipping.general.description")}
      </p>
    </div>
  );
}
