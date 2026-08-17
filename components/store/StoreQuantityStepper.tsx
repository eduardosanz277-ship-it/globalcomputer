"use client";

import { Minus, Plus } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/utils/cn";

type StoreQuantityStepperProps = {
  value: number;
  min?: number;
  max: number;
  disabled?: boolean;
  className?: string;
  onChange: (next: number) => void;
  allowDecrementAtMin?: boolean;
  onDecrementAtMin?: () => void;
};

export function StoreQuantityStepper({
  value,
  min = 1,
  max,
  disabled = false,
  className,
  onChange,
  allowDecrementAtMin = false,
  onDecrementAtMin,
}: StoreQuantityStepperProps) {
  const { t } = useI18n();
  const canDec = !disabled && (value > min || allowDecrementAtMin);
  const canInc = !disabled && value < max;

  return (
    <div
      className={cn(
        "flex h-12 w-fit shrink-0 self-start items-stretch overflow-hidden rounded-xl border border-border/35 bg-white shadow-sm dark:border-border/50 dark:bg-card",
        disabled && "pointer-events-none opacity-40",
        className,
      )}
      role="group"
      aria-label={t("storefront.productDetail.quantityAria")}
    >
      <button
        type="button"
        className="flex w-11 items-center justify-center text-muted-foreground transition hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset disabled:opacity-30"
        aria-label={
          value <= min && allowDecrementAtMin
            ? t("storefront.cart.removeFromCartAria")
            : t("storefront.productDetail.quantityDecreaseAria")
        }
        disabled={!canDec}
        onClick={() => {
          if (value <= min) {
            if (allowDecrementAtMin) onDecrementAtMin?.();
            return;
          }
          onChange(Math.max(min, value - 1));
        }}
      >
        <Minus className="h-4 w-4" strokeWidth={2.75} />
      </button>
      <span className="flex min-w-[2.75rem] select-none items-center justify-center border-x border-border/50 px-2 text-center text-sm font-semibold tabular-nums text-foreground">
        {value}
      </span>
      <button
        type="button"
        className="flex w-11 items-center justify-center text-muted-foreground transition hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset disabled:opacity-30"
        aria-label={t("storefront.productDetail.quantityIncreaseAria")}
        disabled={!canInc}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus className="h-4 w-4" strokeWidth={2.75} />
      </button>
    </div>
  );
}
