"use client";

import { AuthBrandHeader, AuthCard, AuthLayout } from "@/components/auth";
import { useI18n } from "@/components/i18n/I18nProvider";

export function AuthPageSuspenseFallback() {
  const { t } = useI18n();
  return (
    <AuthLayout>
      <AuthBrandHeader />
      <AuthCard>
        <p className="text-center text-sm text-muted-foreground">
          {t("login.loading")}
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
