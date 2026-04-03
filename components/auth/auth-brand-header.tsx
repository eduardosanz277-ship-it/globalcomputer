"use client";

import Link from "next/link";
import { AppLogo } from "@/components/brand/AppLogo";
import { SITE_BRAND_NAME, SITE_BRAND_TAGLINE } from "@/lib/site";
import { cn } from "@/utils/cn";

type AuthBrandHeaderProps = {
  className?: string;
  /** Oculta la línea de tagline (misma jerarquía que el header desktop). */
  hideTagline?: boolean;
};

/**
 * Marca alineada con la fila superior del `SiteHeader` (logo + nombre + tagline).
 */
export function AuthBrandHeader({
  className,
  hideTagline = false,
}: AuthBrandHeaderProps) {
  return (
    <div className={cn("mb-8 flex justify-center px-1", className)}>
      <Link
        href="/"
        aria-label={`${SITE_BRAND_NAME} — Inicio`}
        className="flex min-w-0 max-w-full items-center gap-1 rounded-md py-0.5 text-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:gap-2"
      >
        <AppLogo
          priority
          className="h-[3.25rem] max-h-[3.75rem] shrink-0 sm:h-[4.5rem] sm:max-h-[4.75rem]"
        />
        <span className="min-w-0 text-left">
          <span className="block truncate font-roboto text-base font-light leading-tight tracking-tight text-[#040b1f] sm:text-lg lg:text-xl">
            {SITE_BRAND_NAME}
          </span>
          {!hideTagline ? (
            <span className="mt-0.5 block truncate text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/90">
              {SITE_BRAND_TAGLINE}
            </span>
          ) : null}
        </span>
      </Link>
    </div>
  );
}
