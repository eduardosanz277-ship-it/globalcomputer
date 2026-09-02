"use client";

import { useTransition } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Loader2, RefreshCw, ServerCrash, WifiOff } from "lucide-react";
import { cn } from "@/utils/cn";

type Props = {
  /** `false` muestra la variante de error genérico del servidor. */
  isNetworkError?: boolean;
  onRetry: () => void;
  className?: string;
};

export function ConnectionErrorState({
  isNetworkError = true,
  onRetry,
  className,
}: Props) {
  const { t } = useI18n();
  const [isRetrying, startRetry] = useTransition();

  const Icon = isNetworkError ? WifiOff : ServerCrash;
  const prefix = isNetworkError
    ? "common.connectionError"
    : "common.serverError";

  return (
    <div className={cn("flex w-full justify-center px-4 py-10", className)}>
      <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary/30 via-border/60 to-destructive/25 p-px shadow-soft-lg">
        <div className="relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-card/95 px-6 py-8 text-center backdrop-blur-md sm:px-10 sm:py-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
          />

          <span
            className={cn(
              "relative mx-auto flex h-16 w-16 items-center justify-center rounded-full ring-1",
              isNetworkError
                ? "bg-primary/10 text-primary ring-primary/20"
                : "bg-destructive/10 text-destructive ring-destructive/20",
            )}
          >
            <Icon className="h-7 w-7" aria-hidden />
          </span>

          <h2 className="relative mt-6 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {t(`${prefix}.title`)}
          </h2>
          <p className="relative mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {isNetworkError
              ? t("common.errors.network")
              : t(`${prefix}.description`)}
          </p>

          <div className="relative mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => startRetry(() => onRetry())}
              disabled={isRetrying}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-colors duration-200 hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:opacity-70"
            >
              {isRetrying ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
              )}
              {isRetrying
                ? t("common.connectionError.retrying")
                : t("common.connectionError.retry")}
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border/70 bg-background/80 px-5 text-sm font-semibold text-foreground/90 transition hover:border-primary/30 hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
            >
              {t("common.connectionError.reload")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
