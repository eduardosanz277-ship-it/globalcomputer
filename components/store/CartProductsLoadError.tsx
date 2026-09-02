"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { formatClientError } from "@/lib/errors/format-client-error";
import { isNetworkActionError } from "@/lib/errors/network-action-error";
import { cn } from "@/utils/cn";
import { RefreshCw, WifiOff } from "lucide-react";

type Props = {
  error: unknown;
  onRetry?: () => void;
  /** Ocupa el panel completo, como el carrito vacío (drawer / página). */
  variant?: "inline" | "panel";
  className?: string;
};

export function CartProductsLoadError({
  error,
  onRetry,
  variant = "inline",
  className,
}: Props) {
  const { t } = useI18n();
  const isNetwork = isNetworkActionError(error);
  const message = formatClientError(error, t, {
    errorMessage: t("storefront.cart.productsLoadError"),
  });
  const title = isNetwork
    ? t("common.connectionError.title")
    : t("storefront.cart.productsLoadError");

  if (variant === "panel") {
    return (
      <div
        role="alert"
        className={cn(
          "flex flex-col items-center justify-center py-8 text-center md:py-14",
          className,
        )}
      >
        <div
          className={cn(
            "mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-border/60 bg-white/60",
            !isNetwork && "text-destructive",
          )}
        >
          <WifiOff
            className={cn(
              "h-10 w-10",
              isNetwork ? "text-primary" : "text-destructive",
            )}
            strokeWidth={1.25}
            aria-hidden
          />
        </div>
        <p className="text-sm font-medium text-foreground sm:text-base">
          {title}
        </p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground sm:text-sm">
          {message}
        </p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
            {t("common.connectionError.retry")}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 px-4 py-6 text-center",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full ring-1",
          isNetwork
            ? "bg-primary/10 text-primary ring-primary/20"
            : "bg-destructive/10 text-destructive ring-destructive/20",
        )}
      >
        <WifiOff className="h-5 w-5" aria-hidden />
      </span>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        {message}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
        >
          <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
          {t("common.connectionError.retry")}
        </button>
      ) : null}
    </div>
  );
}
