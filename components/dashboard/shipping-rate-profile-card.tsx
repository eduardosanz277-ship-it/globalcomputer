"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { formatUsd } from "@/components/store/store-cart-format";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/utils/cn";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { formatRelativeLastAccess } from "@/utils/formatRelativeLastAccess";

export type ShippingRateProfileCardProps = {
  order: number;
  minAmount: number;
  maxAmount: number;
  cost: number;
  active: boolean;
  updatedAt: string;
  className?: string;
  actions?: ReactNode;
  /** Mientras se guarda el estado (petición + refresh). */
  activeUpdating?: boolean;
  onActiveChange?: (active: boolean) => void;
};

/**
 * Card móvil para tarifas de envío: orden + acciones en cabecera,
 * detalle en columna y última actualización con separador dentro del padding.
 */
export function ShippingRateProfileCard({
  order,
  minAmount,
  maxAmount,
  cost,
  active,
  updatedAt,
  className,
  actions,
  activeUpdating = false,
  onActiveChange,
}: ShippingRateProfileCardProps) {
  const { t, locale } = useI18n();
  const relative = formatRelativeLastAccess(updatedAt, locale);
  const absolute = formatDateDdMmYyyyHhMm(updatedAt, locale);

  return (
    <article
      className={cn(
        "min-w-0 overflow-hidden rounded-xl border border-border/80 bg-card text-card-foreground",
        "transition-shadow duration-200 hover:shadow-sm",
        className,
      )}
    >
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div
            className={cn(
              "inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg px-2.5",
              "border border-border/70 bg-muted/60",
              "text-xs font-semibold tabular-nums tracking-tight text-foreground",
            )}
            aria-label={`${t("admin.shipping.rates.table.sortOrder")} ${order}`}
          >
            {order}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("admin.shipping.rates.table.from")} –{" "}
              {t("admin.shipping.rates.table.to")}
            </p>
            <p className="text-base font-semibold leading-snug tracking-tight text-foreground">
              <span className="tabular-nums">{formatUsd(minAmount)}</span>
              <span className="mx-1.5 font-normal text-muted-foreground">–</span>
              <span className="tabular-nums">{formatUsd(maxAmount)}</span>
            </p>
          </div>

          <div className="min-w-0 space-y-1">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("admin.shipping.rates.table.cost")}
            </p>
            <p className="text-sm font-medium tabular-nums text-foreground">
              {formatUsd(cost)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("admin.shipping.rates.table.active")}
            </span>
            <Switch
              checked={active}
              disabled={!onActiveChange || activeUpdating}
              aria-label={t("admin.shipping.rates.table.active")}
              onCheckedChange={onActiveChange}
            />
            {activeUpdating ? (
              <Loader2
                className="h-4 w-4 shrink-0 animate-spin text-muted-foreground"
                aria-hidden
              />
            ) : null}
          </div>
        </div>

        <div
          className="border-t border-border/60"
          role="separator"
          aria-hidden
        />

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {t("admin.shipping.rates.table.updatedTooltip")}
          </p>
          <p className="text-sm text-foreground" title={absolute || undefined}>
            {relative != null ? relative : absolute}
          </p>
        </div>
      </div>
    </article>
  );
}
