"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";

const backNavClassName =
  "inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground";

type AuthBackToHomeProps = {
  href?: string;
  label?: string;
  onClick?: () => void;
};

/**
 * Navegación secundaria bajo el panel de autenticación (home o paso anterior).
 */
export function AuthBackToHome({
  href = "/",
  label,
  onClick,
}: AuthBackToHomeProps = {}) {
  const { t } = useI18n();
  const text = label ?? t("common.backToHome");

  return (
    <div className="mt-6 flex justify-center">
      {onClick ? (
        <button type="button" onClick={onClick} className={backNavClassName}>
          <ChevronLeft
            className="h-4 w-4 shrink-0"
            strokeWidth={2.5}
            aria-hidden
          />
          {text}
        </button>
      ) : (
        <Link href={href} className={backNavClassName}>
          <ChevronLeft
            className="h-4 w-4 shrink-0"
            strokeWidth={2.5}
            aria-hidden
          />
          {text}
        </Link>
      )}
    </div>
  );
}
