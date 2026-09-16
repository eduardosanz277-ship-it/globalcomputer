"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { formatUsd } from "@/components/store/store-cart-format";
import { OrderDetailsRecipientSection } from "@/components/orders/OrderDetailsRecipientSection";
import { OrderLineProductLabel } from "@/components/orders/OrderLineProductLabel";
import { OrderStatusHistoryTimeline } from "@/components/orders/OrderStatusHistoryTimeline";
import { formatStoreOrderDateTime } from "@/lib/store-order-datetime";
import type { GuestOrderLookupResult } from "@/modules/commerce/store-order-guest-lookup.service";
import type { SiteOrderStatus } from "@/modules/commerce/store-orders.service";
import { cn } from "@/utils/cn";
import { Package } from "lucide-react";
import { useMemo, type ReactNode } from "react";

const orderStatusStyles: Record<string, string> = {
  pending: "bg-slate-50 text-slate-700 border border-slate-200",
  confirmed: "bg-sky-50 text-sky-700 border border-sky-200",
  processing: "bg-amber-50 text-amber-700 border border-amber-200",
  shipping: "bg-violet-50 text-violet-700 border border-violet-200",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border border-red-200",
};

type Props = {
  order: GuestOrderLookupResult;
};

function statusPillClass(status: string): string {
  return cn(
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide",
    orderStatusStyles[status] ?? "bg-muted text-muted-foreground",
  );
}

function SummaryTile({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <p className="mt-1 break-all text-sm font-semibold tabular-nums text-foreground">
        {children}
      </p>
    </div>
  );
}

/** Detalle de pedido para consulta pública (sin cuenta). */
export function GuestOrderDetailsPanel({ order }: Props) {
  const { t, locale } = useI18n();
  const localeTag = locale === "en" ? "en" : "es";
  const formatMoney = (value: number) => formatUsd(value);
  const formatDate = (iso: string) =>
    formatStoreOrderDateTime(iso, localeTag) ?? "—";

  const statusLabels = useMemo<Record<SiteOrderStatus, string>>(
    () => ({
      pending: t("admin.orders.status.pending"),
      confirmed: t("admin.orders.status.confirmed"),
      processing: t("admin.orders.status.processing"),
      shipping: t("admin.orders.status.shipping"),
      completed: t("admin.orders.status.completed"),
      cancelled: t("admin.orders.status.cancelled"),
    }),
    [t],
  );

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-card/80 shadow-sm">
      <div className="border-b border-border/60 bg-muted/25 px-4 py-5 sm:px-6">
        <div className="flex gap-4">
          <div
            className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/10 sm:flex"
            aria-hidden
          >
            <Package className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <h2 className="text-lg font-semibold leading-tight tracking-tight text-foreground">
              {t("orderLookup.resultTitle")}
            </h2>
            <div className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
              <p className="break-words">
                {t("orderLookup.orderPrefix")}{" "}
                <span className="font-mono font-medium text-foreground">
                  {order.orderNumber}
                </span>
              </p>
              <p>
                {t("profile.dialogDateLabel")}{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {formatDate(order.createdAt)}
                </span>
              </p>
              <p className="flex flex-wrap items-center gap-2">
                <span>{t("profile.dialogStatusLabel")}:</span>
                <span className={statusPillClass(order.status)}>
                  {statusLabels[order.status] ?? order.status}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-4 py-5 sm:px-6">
        {order.items.length === 0 ? (
          <p className="rounded-lg border border-border/70 bg-muted/25 px-3 py-2 text-sm text-muted-foreground">
            {t("orderLookup.emptyItems")}
          </p>
        ) : (
          <div className="min-w-0 overflow-hidden rounded-xl border border-primary/25 bg-primary/[0.03] shadow-sm">
            <ul className="divide-y divide-primary/15 sm:hidden">
              {order.items.map((item, index) => (
                <li
                  key={`${item.productName}-${index}`}
                  className="space-y-1.5 px-3.5 py-3"
                >
                  <OrderLineProductLabel
                    name={item.productName}
                    sku={item.productSku}
                    skuLabel={t("storefront.productDetail.skuLabel")}
                    nameClassName="text-sm font-medium leading-snug text-foreground"
                  />
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="tabular-nums text-muted-foreground">
                      {item.quantity} × {formatMoney(item.unitPrice)}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-foreground">
                      {formatMoney(item.totalPrice)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-primary/[0.1] text-xs uppercase tracking-wide text-foreground/80">
                  <tr>
                    <th className="px-4 py-2.5 text-left">
                      {t("profile.tableProduct")}
                    </th>
                    <th className="px-4 py-2.5 text-left">
                      {t("profile.tableQty")}
                    </th>
                    <th className="px-4 py-2.5 text-left">
                      {t("profile.tableUnitPrice")}
                    </th>
                    <th className="px-4 py-2.5 text-left">
                      {t("profile.tableLineTotal")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr
                      key={`${item.productName}-${index}`}
                      className="border-t border-primary/15 transition hover:bg-primary/[0.07]"
                    >
                      <td className="max-w-[18rem] px-4 py-2.5 font-medium">
                        <OrderLineProductLabel
                          name={item.productName}
                          sku={item.productSku}
                          skuLabel={t("storefront.productDetail.skuLabel")}
                        />
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">
                        {item.quantity}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 tabular-nums">
                        {formatMoney(item.unitPrice)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 font-semibold tabular-nums text-foreground">
                        {formatMoney(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryTile title={t("profile.summarySubtotal")}>
            {formatMoney(order.amountSubtotal)}
          </SummaryTile>
          <SummaryTile title={t("profile.summaryDiscount")}>
            {order.amountDiscount > 0
              ? `−${formatMoney(order.amountDiscount)}`
              : formatMoney(0)}
          </SummaryTile>
          <SummaryTile title={t("profile.summaryTax")}>
            {formatMoney(order.amountTax)}
          </SummaryTile>
          <SummaryTile title={t("profile.summaryShipping")}>
            {formatMoney(order.amountShipping)}
          </SummaryTile>
          <SummaryTile title={t("profile.summaryTotal")}>
            {formatMoney(order.total)}
          </SummaryTile>
        </div>

        {order.shippingAddress ? (
          <OrderDetailsRecipientSection recipient={order.shippingAddress} />
        ) : null}

        <OrderStatusHistoryTimeline
          entries={order.statusHistory}
          statusLabels={statusLabels}
          statusBadgeClass={statusPillClass}
          showActor={false}
          stackDateBelowOnNarrow
        />
      </div>
    </div>
  );
}
