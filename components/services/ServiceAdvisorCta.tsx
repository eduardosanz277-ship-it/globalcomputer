"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import Link from "next/link";
import { Headset, MessageCircle, PhoneCall } from "lucide-react";
import { cn } from "@/utils/cn";

type Props = {
  serviceName: string;
  serviceNameEn?: string | null;
  phoneDisplay?: string;
  phoneTel?: string;
  className?: string;
  /** Une el borde superior con el bloque anterior en móvil. */
  flushTop?: boolean;
};

export function ServiceAdvisorCta({
  serviceName,
  serviceNameEn,
  phoneDisplay,
  phoneTel,
  className,
  flushTop = false,
}: Props) {
  const { locale, t } = useI18n();
  const displayName =
    locale === "en" ? serviceNameEn?.trim() || serviceName : serviceName;
  const contactHref = `/contact?subject=${encodeURIComponent(
    t("servicePage.advisorCta.subjectPrefix").replace(
      "{service}",
      displayName,
    ),
  )}`;

  const ctaActions = (
    <>
      <Link
        href={contactHref}
        className="hidden inline-flex h-11 min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-colors duration-200 hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 sm:flex-1 lg:w-auto lg:flex-none lg:px-6"
      >
        {t("servicePage.advisorCta.cta")}
        <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
      </Link>
      {phoneTel && phoneDisplay ? (
        <a
          href={`tel:${phoneTel}`}
          className="inline-flex h-11 min-h-11 w-full items-center justify-center gap-2 rounded-full border border-border/70 bg-background/80 px-5 text-sm font-semibold text-foreground/90 backdrop-blur-sm transition hover:border-primary/30 hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 md:w-auto md:flex-none"
          aria-label={`${
            locale === "en" ? "Talk to an advisor" : "Hablar con un asesor"
          } (${phoneDisplay})`}
        >
          <PhoneCall className="h-4 w-4 shrink-0" aria-hidden />
          {locale === "en" ? "Talk to an advisor" : "Hablar con un asesor"}
        </a>
      ) : null}
    </>
  );

  return (
    <aside
      aria-label={t("servicePage.advisorCta.ariaLabel")}
      className={cn("w-full", className)}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/50 via-primary/20 to-emerald-400/40 p-px shadow-soft-lg",
          flushTop && "max-lg:rounded-t-none max-lg:border-x-0",
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-[calc(1rem-1px)] bg-card/95 backdrop-blur-md",
            flushTop && "max-lg:rounded-t-none",
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/15 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-emerald-400/10 blur-3xl"
          />

          <div className="relative flex flex-col gap-5 p-5 sm:gap-5 sm:p-6 md:flex-row md:items-center md:justify-between md:gap-6 lg:gap-8 lg:p-8">
            <div className="flex min-w-0 items-start gap-3 sm:gap-4 md:flex-1">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/85 text-primary-foreground shadow-lg shadow-primary/20 ring-1 ring-white/20 sm:h-12 sm:w-12">
                <Headset className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                  {t("servicePage.advisorCta.badge")}
                </p>
                <h2 className="mt-1 text-pretty text-base font-bold tracking-tight text-foreground sm:text-lg lg:text-xl">
                  {t("servicePage.advisorCta.title")}
                </h2>
                <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {t("servicePage.advisorCta.description").replace(
                    "{service}",
                    displayName,
                  )}
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-center md:w-auto md:shrink-0">
              {ctaActions}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
