"use client";

import { inter } from "@/lib/fonts/inter";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/utils/cn";
import { Home } from "lucide-react";
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

function BreadcrumbHomeIcon({ className }: { className?: string }) {
  return (
    <Home
      className={cn(
        "h-[1.05em] w-[1.05em] shrink-0 text-current",
        className,
      )}
      aria-hidden
      strokeWidth={2}
      color="currentColor"
    />
  );
}

/**
 * Migas del storefront: `text-sm`, enlaces muted + hover, último tramo en negrita (mismo color).
 * El enlace a `/` se muestra como icono Home (mismo que el menú de usuario del admin).
 */
export function MarketingBreadcrumb({ items, className }: Props) {
  const { t } = useI18n();
  if (items.length === 0) return null;

  return (
    <nav
      aria-label={t("common.breadcrumb")}
      className={cn(
        inter.className,
        "text-sm font-normal text-[#55575b] sm:text-[15px]",
        "max-md:overflow-x-auto max-md:py-1 max-md:scrollbar-none",
        className,
      )}
    >
      <div className="flex flex-nowrap items-center max-md:w-max max-md:gap-0.5 md:flex md:flex-wrap md:items-center">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          const isHome = item.href === "/";
          const content = isHome ? <BreadcrumbHomeIcon /> : item.label;

          return (
            <span
              key={i}
              className="inline-flex shrink-0 items-center leading-none"
            >
              {i > 0 ? (
                <span className="mx-2.5 leading-none" aria-hidden>
                  /
                </span>
              ) : null}
              {isLast ? (
                <span className="inline-flex items-center font-bold leading-none text-inherit">
                  {content}
                </span>
              ) : (
                <Link
                  href={item.href!}
                  className="inline-flex items-center leading-none text-inherit transition-colors hover:text-foreground"
                  aria-label={isHome ? t("common.home") : undefined}
                >
                  {content}
                </Link>
              )}
            </span>
          );
        })}
      </div>
    </nav>
  );
}
