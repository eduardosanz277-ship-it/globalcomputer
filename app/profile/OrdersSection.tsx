"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { SortableHeader } from "@/components/admin/admin-sortable-table-header";
import { appToolbarSelectStyles } from "@/components/ui/react-select-app-styles";
import { STORE_ORDERS_STATUS_FILTER_WIDE_CH } from "@/lib/store-orders-status-filter-width";
import { ORDER_DETAILS_DIALOG_CONTENT_CLASSNAME } from "@/lib/order-details-dialog";
import type { SiteOrderStatus } from "@/modules/commerce/store-orders.service";
import type { ColumnDef, Row } from "@tanstack/react-table";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";
import Select from "react-select";
import { Eye, FilterX, Package } from "lucide-react";
import { cn } from "@/utils/cn";
import type { CuentaOrder } from "./types";
import {
  formatOrderCurrency,
  formatOrderDate,
  orderStatusStyles,
} from "./order-utils";
import { OrderDetailsRecipientSection } from "@/components/orders/OrderDetailsRecipientSection";
import { OrderStatusHistoryTimeline } from "@/components/orders/OrderStatusHistoryTimeline";

type Props = {
  orders: CuentaOrder[];
};

const STATUS_OPTIONS: SiteOrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipping",
  "completed",
  "cancelled",
];

type StatusFilterValue = SiteOrderStatus | "all";

/** Etiqueta traducida como en admin; si no hay clave, el valor crudo del backend. */
function orderStatusLabel(status: string, tf: (key: string) => string): string {
  const key = `admin.orders.status.${status}`;
  const v = tf(key);
  return v !== key ? v : status;
}

/** Misma lógica de acento lateral que `StoreOrdersTable` / pedidos admin. */
function profileOrderRowClassName(order: CuentaOrder): string {
  const base = "hover:bg-muted/50 transition-colors duration-150";
  const s = order.status;
  if (s === "pending") {
    return cn(base, "shadow-[inset_2px_0_0_rgba(100,116,139,0.35)]");
  }
  if (s === "confirmed") {
    return cn(base, "shadow-[inset_2px_0_0_rgba(14,165,233,0.35)]");
  }
  if (s === "processing") {
    return cn(base, "shadow-[inset_2px_0_0_rgba(245,158,11,0.35)]");
  }
  if (s === "shipping") {
    return cn(base, "shadow-[inset_2px_0_0_rgba(139,92,246,0.35)]");
  }
  if (s === "cancelled") {
    return cn(base, "shadow-[inset_2px_0_0_rgba(239,68,68,0.35)]");
  }
  return cn(base, "shadow-[inset_2px_0_0_rgba(16,185,129,0.35)]");
}

function statusPillClass(status: string): string {
  return cn(
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide",
    orderStatusStyles[status] ?? "bg-muted text-muted-foreground",
  );
}

const COL_ORDER =
  "w-[12.5rem] min-w-[12.5rem] max-w-[12.5rem]";
const COL_TOTAL = "w-[9.5rem] min-w-[9.5rem] max-w-[9.5rem]";
const COL_STATUS = "w-[13rem] min-w-[13rem] max-w-[13rem]";
const COL_DATE =
  "w-[12.75rem] min-w-[12.75rem] max-w-[12.75rem]";
const COL_ACTIONS = "w-[11.5rem] min-w-[11.5rem] max-w-[13rem]";

export function OrdersSection({ orders }: Props) {
  const { t, locale } = useI18n();
  const localeTag = locale === "en" ? "en" : "es";
  const [detailOrder, setDetailOrder] = useState<CuentaOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");

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

  const statusSelectOptions = useMemo(
    () =>
      STATUS_OPTIONS.map((value) => ({
        value,
        label: statusLabels[value],
      })),
    [statusLabels],
  );

  const statusFilterOptions = useMemo(
    () =>
      [
        { value: "all" as const, label: t("admin.orders.filters.status.all") },
        ...statusSelectOptions,
      ] as const,
    [statusSelectOptions, t],
  );

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const filterValue =
    statusFilterOptions.find((option) => option.value === statusFilter) ??
    statusFilterOptions[0];

  const toolbarFilters = useMemo(
    () => (
      <div className="flex w-full min-w-0 items-center gap-2">
        <div
          className={cn(
            "min-w-0 flex-1",
            "min-[1440px]:box-border min-[1440px]:w-[var(--profile-orders-status-filter-w)] min-[1440px]:min-w-[var(--profile-orders-status-filter-w)] min-[1440px]:max-w-[var(--profile-orders-status-filter-w)] min-[1440px]:flex-none min-[1440px]:shrink-0",
          )}
          style={
            {
              ["--profile-orders-status-filter-w" as string]: `${STORE_ORDERS_STATUS_FILTER_WIDE_CH}ch`,
            } as CSSProperties
          }
        >
          <Select
            instanceId="profile-orders-status-filter"
            options={[...statusFilterOptions]}
            styles={appToolbarSelectStyles}
            value={filterValue}
            isSearchable={false}
            isClearable={false}
            onChange={(option) => {
              if (!option) return;
              setStatusFilter(option.value);
            }}
            className="w-full min-w-0"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 border-border/80 text-muted-foreground hover:text-foreground"
          disabled={statusFilter === "all"}
          onClick={() => setStatusFilter("all")}
          title={t("admin.orders.filters.clear")}
          aria-label={t("admin.orders.filters.clearAria")}
        >
          <FilterX className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    ),
    [filterValue, statusFilter, statusFilterOptions, t],
  );

  const columns = useMemo<ColumnDef<CuentaOrder>[]>(
    () => [
      {
        id: "pedido",
        accessorKey: "orderNumber",
        enableSorting: true,
        header: t("profile.orderColOrder"),
        meta: {
          cellClassName: COL_ORDER,
        },
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium tabular-nums text-foreground">
            {row.original.orderNumber}
          </span>
        ),
      },
      {
        id: "fecha",
        accessorKey: "createdAt",
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.createdAt
            ? new Date(rowA.original.createdAt).getTime()
            : 0;
          const b = rowB.original.createdAt
            ? new Date(rowB.original.createdAt).getTime()
            : 0;
          return a - b;
        },
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("profile.orderColDate")}
            ariaLabelIdle={t("admin.orders.table.createdAtSortIdle")}
            ariaLabelAsc={t("admin.orders.table.createdAtSortAsc")}
            ariaLabelDesc={t("admin.orders.table.createdAtSortDesc")}
          />
        ),
        meta: {
          cellClassName: COL_DATE,
        },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap tabular-nums">
            {formatOrderDate(row.original.createdAt, localeTag)}
          </span>
        ),
      },
      {
        id: "total",
        accessorKey: "total",
        enableSorting: true,
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("profile.orderColTotal")}
            ariaLabelIdle={t("admin.orders.table.totalSortIdle")}
            ariaLabelAsc={t("admin.orders.table.totalSortAsc")}
            ariaLabelDesc={t("admin.orders.table.totalSortDesc")}
          />
        ),
        meta: {
          cellClassName: COL_TOTAL,
        },
        cell: ({ row }) => (
          <span className="font-semibold text-foreground tabular-nums">
            {formatOrderCurrency(row.original.total, localeTag)}
          </span>
        ),
      },
      {
        id: "estado",
        accessorKey: "status",
        enableSorting: true,
        header: t("profile.orderColStatus"),
        meta: {
          cellClassName: COL_STATUS,
        },
        cell: ({ row }) => (
          <span className={statusPillClass(row.original.status)}>
            {orderStatusLabel(row.original.status, t)}
          </span>
        ),
      },
      {
        id: "actions",
        enableSorting: false,
        header: t("profile.orderColAction"),
        meta: {
          cellClassName: COL_ACTIONS,
        },
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            type="button"
            className="h-8 rounded-full border-border/80 bg-background px-3 text-xs font-medium text-foreground shadow-sm transition hover:border-primary/40 hover:bg-primary/[0.06] hover:text-primary"
            onClick={() => setDetailOrder(row.original)}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            {t("profile.viewDetails")}
          </Button>
        ),
      },
    ],
    [t, localeTag],
  );

  const renderMobileRow = useCallback(
    (row: Row<CuentaOrder>) => {
      const order = row.original;
      return (
        <li
          key={row.id}
          className={cn(
            "relative min-w-0 rounded-xl border border-border/80 bg-card p-4 text-card-foreground transition-shadow duration-200 hover:shadow-sm",
            profileOrderRowClassName(order),
          )}
        >
          <div className="space-y-3">
            <p className="font-mono text-sm font-medium tabular-nums text-foreground">
              {t("profile.dialogOrderPrefix")} {order.orderNumber}
            </p>
            <p className="text-sm text-muted-foreground tabular-nums">
              {formatOrderDate(order.createdAt, localeTag)}
            </p>
            <p className="text-sm font-semibold text-foreground">
              {t("profile.summaryTotal")}:{" "}
              {formatOrderCurrency(order.total, localeTag)}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className={statusPillClass(order.status)}>
                {orderStatusLabel(order.status, t)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                type="button"
                className="h-8 rounded-full border-border/80 bg-background px-3 text-xs font-medium text-foreground shadow-sm transition hover:border-primary/40 hover:bg-primary/[0.06] hover:text-primary"
                onClick={() => setDetailOrder(order)}
              >
                <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                {t("profile.viewDetails")}
              </Button>
            </div>
          </div>
        </li>
      );
    },
    [localeTag, t],
  );

  return (
    <>
      <Card>
        <CardHeader className="text-left">
          <CardTitle className="text-left">{t("profile.ordersTitle")}</CardTitle>
          <CardDescription className="text-left">
            {t("profile.ordersDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("profile.ordersEmpty")}
            </p>
          ) : (
            <DataTable
              columns={columns}
              data={filteredOrders}
              enableSorting
              searchPlaceholder={t("profile.searchOrdersPlaceholder")}
              toolbarSearchInputClassName="bg-white dark:bg-card"
              toolbarFilters={toolbarFilters}
              tableClassName="table-fixed min-w-[640px]"
              tableHeadCellClassName="!font-medium"
              tableBodyCellClassName="py-4"
              paginationClassName="border-border/50"
              paginationButtonVariant="ghost"
              getRowClassName={(row) => profileOrderRowClassName(row)}
              renderMobileRow={renderMobileRow}
            />
          )}
        </CardContent>
      </Card>
      <Dialog
        open={Boolean(detailOrder)}
        onOpenChange={(open) => {
          if (!open) setDetailOrder(null);
        }}
      >
        <DialogContent className={ORDER_DETAILS_DIALOG_CONTENT_CLASSNAME}>
          <DialogHeader className="space-y-0 border-b border-border/60 bg-muted/25 px-6 pb-5 pt-6 text-left">
            <div className="flex gap-4 pr-10">
              <div
                className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/10 sm:flex"
                aria-hidden
              >
                <Package className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="min-w-0 space-y-1.5 pt-0.5">
                <DialogTitle className="text-lg font-semibold leading-tight tracking-tight text-foreground">
                  {detailOrder ? t("profile.dialogOrderDetailsTitle") : ""}
                </DialogTitle>
                {detailOrder ? (
                  <DialogDescription asChild>
                    <div className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
                      <p>
                        {t("admin.orders.items.orderPrefix")}{" "}
                        <span className="font-mono font-medium text-foreground">
                          {detailOrder.orderNumber}
                        </span>
                      </p>
                      <p>
                        {t("profile.dialogDateLabel")}{" "}
                        <span className="font-medium text-foreground tabular-nums">
                          {formatOrderDate(
                            detailOrder.createdAt,
                            localeTag,
                          )}
                        </span>
                      </p>
                      <p className="flex flex-wrap items-center gap-2">
                        <span>{t("profile.dialogStatusLabel")}:</span>
                        <span
                          className={cn(
                            "inline-flex",
                            statusPillClass(detailOrder.status),
                          )}
                        >
                          {orderStatusLabel(detailOrder.status, t)}
                        </span>
                      </p>
                    </div>
                  </DialogDescription>
                ) : (
                  <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                    {t("profile.dialogLoadingDetails")}
                  </DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="max-h-[min(70vh,32rem)] space-y-5 overflow-y-auto px-6 py-5">
            {detailOrder ? (
              <>
                <div className="overflow-hidden rounded-xl border border-primary/25 bg-primary/[0.03] shadow-sm">
                  <div className="overflow-x-auto">
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
                        {detailOrder.items.map((item, index) => (
                          <tr
                            key={`${item.productName}-${index}`}
                            className="border-t border-primary/15 transition hover:bg-primary/[0.07]"
                          >
                            <td className="px-4 py-2.5 font-medium">
                              {item.productName}
                            </td>
                            <td className="px-4 py-2.5 tabular-nums">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-2.5 tabular-nums">
                              {formatOrderCurrency(item.unitPrice, localeTag)}
                            </td>
                            <td className="px-4 py-2.5 font-semibold tabular-nums text-foreground">
                              {formatOrderCurrency(item.totalPrice, localeTag)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <SummaryTile title={t("profile.summarySubtotal")}>
                    {formatOrderCurrency(
                      detailOrder.amountSubtotal,
                      localeTag,
                    )}
                  </SummaryTile>
                  <SummaryTile title={t("profile.summaryDiscount")}>
                    {detailOrder.amountDiscount > 0
                      ? `−${formatOrderCurrency(detailOrder.amountDiscount, localeTag)}`
                      : formatOrderCurrency(0, localeTag)}
                  </SummaryTile>
                  <SummaryTile title={t("profile.summaryTax")}>
                    {formatOrderCurrency(detailOrder.amountTax, localeTag)}
                  </SummaryTile>
                  <SummaryTile title={t("profile.summaryShipping")}>
                    {formatOrderCurrency(
                      detailOrder.amountShipping,
                      localeTag,
                    )}
                  </SummaryTile>
                  <SummaryTile title={t("profile.summaryTotal")}>
                    {formatOrderCurrency(detailOrder.total, localeTag)}
                  </SummaryTile>
                </div>

                {detailOrder.shippingAddress ? (
                  <OrderDetailsRecipientSection
                    recipient={detailOrder.shippingAddress}
                  />
                ) : null}

                <OrderStatusHistoryTimeline
                  entries={detailOrder.statusHistory}
                  statusLabels={statusLabels}
                  statusBadgeClass={statusPillClass}
                  showActor={false}
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("profile.dialogLoadingDetails")}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
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
    <div className="rounded-xl border border-border/60 bg-white p-4 shadow-sm dark:bg-card">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <p className="mt-1.5 text-lg font-semibold tabular-nums leading-none text-foreground">
        {children}
      </p>
    </div>
  );
}
