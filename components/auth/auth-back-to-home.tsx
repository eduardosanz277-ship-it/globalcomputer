"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";

/**
 * Enlace a la home, fuera del panel de autenticación.
 */
export function AuthBackToHome() {
  const { t } = useI18n();

  return (
    <div className="mt-6 flex justify-center">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />
        {t("common.backToHome")}
      </Link>
    </div>
  );
}
