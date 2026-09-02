"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import Link from "next/link";
import { Headset, MessageCircle, Phone } from "lucide-react";
import { cn } from "@/utils/cn";

type Props = {
  serviceName: string;
  serviceNameEn?: string | null;
  phoneDisplay?: string;
  phoneTel?: string;
  className?: string;
};

export function ServiceAdvisorCta({
  serviceName,
  serviceNameEn,
  phoneDisplay,
  phoneTel,
  className,
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
        className="inline-flex h-11 min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-colors duration-200 hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
      >
        {t("servicePage.advisorCta.cta")}
        <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
      </Link>
      {phoneTel && phoneDisplay ? (
        <a
          href={`tel:${phoneTel}`}
          className="inline-flex h-11 min-h-11 items-center justify-center gap-2 rounded-full border border-border/70 bg-background/80 px-5 text-sm font-semibold text-foreground/90 backdrop-blur-sm transition hover:border-primary/30 hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
        >
          <Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          {phoneDisplay}
        </a>
      ) : null}
    </>
  );

  return (
    <aside
      aria-label={t("servicePage.advisorCta.ariaLabel")}
      className={cn("w-full", className)}
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/50 via-primary/20 to-emerald-400/40 p-px shadow-soft-lg max-lg:rounded-t-none max-lg:border-x-0">
        <div className="relative overflow-hidden rounded-[calc(1rem-1px)] bg-card/95 backdrop-blur-md max-lg:rounded-t-none">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/15 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-emerald-400/10 blur-3xl"
          />

          <div className="relative flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:p-8">
            <div className="flex min-w-0 items-start gap-4 lg:flex-1">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/85 text-primary-foreground shadow-lg shadow-primary/20 ring-1 ring-white/20">
                <Headset className="h-6 w-6" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                  {t("servicePage.advisorCta.badge")}
                </p>
                <h2 className="mt-1 text-lg font-bold tracking-tight text-foreground sm:text-xl">
                  {t("servicePage.advisorCta.title")}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {t("servicePage.advisorCta.description").replace(
                    "{service}",
                    displayName,
                  )}
                </p>
                <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center lg:hidden">
                  {ctaActions}
                </div>
              </div>
            </div>

            <div className="hidden shrink-0 flex-col gap-2.5 sm:flex-row sm:items-center lg:flex">
              {ctaActions}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
