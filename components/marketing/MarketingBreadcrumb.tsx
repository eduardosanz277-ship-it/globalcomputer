"use client";

import { inter } from "@/lib/fonts/inter";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/utils/cn";
import Link from "next/link";
import type { ReactNode } from "react";

export type MarketingBreadcrumbItem = {
  label: ReactNode;
  /** Obligatorio salvo en el último tramo (página actual). */
  href?: string;
};

type Props = {
  items: MarketingBreadcrumbItem[];
  className?: string;
};

/**
 * Migas del storefront: `text-sm`, enlaces muted + hover, último tramo en negrita (mismo color).
 */
export function MarketingBreadcrumb({ items, className }: Props) {
  const { t } = useI18n();
  if (items.length === 0) return null;

  return (
    <nav
      aria-label={t("common.breadcrumb")}
      className={cn(
        inter.className,
        "text-sm font-normal text-muted-foreground sm:text-[15px]",
        className,
      )}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="inline">
            {i > 0 ? (
              <span className="mx-2" aria-hidden>
                /
              </span>
            ) : null}
            {isLast ? (
              <span className="font-bold text-muted-foreground">
                {item.label}
              </span>
            ) : (
              <Link href={item.href!} className="hover:text-foreground">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
