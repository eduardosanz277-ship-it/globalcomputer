"use client";

import { Star } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/utils/cn";

export type RatingStarsInputProps = {
  id: string;
  /** `id` del `<Label>` visible que describe el grupo. */
  labelledBy: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Selector de 1–5 estrellas (sin `<select>`), con foco por teclado y `radiogroup`.
 */
export function RatingStarsInput({
  id,
  labelledBy,
  value,
  onChange,
  disabled,
  className,
}: RatingStarsInputProps) {
  const { t } = useI18n();
  const safe = Math.min(5, Math.max(1, value || 1));
  const ratingLabels: Record<number, string> = {
    1: t("storefront.productDetail.ratingPoor"),
    2: t("storefront.productDetail.ratingFair"),
    3: t("storefront.productDetail.ratingGood"),
    4: t("storefront.productDetail.ratingVeryGood"),
    5: t("storefront.productDetail.ratingExcellent"),
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        role="radiogroup"
        aria-labelledby={labelledBy}
        className="flex flex-wrap items-center gap-1 sm:gap-1.5"
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const active = n <= safe;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={safe === n}
              disabled={disabled}
              onClick={() => !disabled && onChange(n)}
              onKeyDown={(e) => {
                if (disabled) return;
                if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                  e.preventDefault();
                  onChange(Math.min(5, safe + 1));
                } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                  e.preventDefault();
                  onChange(Math.max(1, safe - 1));
                }
              }}
              className={cn(
                "rounded-lg p-1 transition hover:scale-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                disabled && "pointer-events-none opacity-50",
                active
                  ? "text-amber-500 dark:text-amber-400"
                  : "text-muted-foreground/35 hover:text-muted-foreground/55",
              )}
              aria-label={t("storefront.productDetail.ratingStarOptionAria")
                .replace("{n}", String(n))
                .replace(
                  "{stars}",
                  n === 1
                    ? t("storefront.productDetail.ratingStarWordOne")
                    : t("storefront.productDetail.ratingStarWord"),
                )
                .replace("{label}", ratingLabels[n])}
            >
              <Star
                className={cn(
                  "h-9 w-9 sm:h-10 sm:w-10",
                  active && "fill-current drop-shadow-sm",
                )}
                strokeWidth={active ? 0 : 1.35}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
      <p
        id={`${id}-hint`}
        className="text-sm text-muted-foreground"
        aria-live="polite"
      >
        {ratingLabels[safe]}
        <span className="tabular-nums text-foreground/80">
          {" "}
          · {safe}/5
        </span>
      </p>
    </div>
  );
}
