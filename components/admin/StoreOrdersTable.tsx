"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { toast } from "react-toastify";
import { ColumnDef, Row } from "@tanstack/react-table";
import Select from "react-select";
import { formatUsd } from "@/components/store/store-cart-format";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { appToolbarSelectStyles } from "@/components/ui/react-select-app-styles";
import { SortableHeader } from "@/components/admin/admin-sortable-table-header";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/utils/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminTableEmptyEmDash } from "@/components/admin/admin-table-empty";
import {
  AdminStoreOrderItemRow,
  AdminStoreOrderRow,
} from "@/modules/commerce/store-orders.admin.service";
import { SiteOrderStatus } from "@/modules/commerce/store-orders.service";
import { Check, Edit3, Eye, FilterX, Loader2, Package } from "lucide-react";
import { createPortal } from "react-dom";
import { formatStoreOrderDateTime } from "@/lib/store-order-datetime";
import { STORE_ORDERS_STATUS_FILTER_WIDE_CH } from "@/lib/store-orders-status-filter-width";

const STATUS_OPTIONS: SiteOrderStatus[] = [
  "confirmada",
  "procesando",
  "enviando",
  "completada",
];
type StatusFilterValue = SiteOrderStatus | "all";
const STATUS_MENU_MIN_WIDTH_PX = 208;
const STATUS_MENU_ESTIMATED_HEIGHT_PX = 168;
const VIEWPORT_GUTTER_PX = 8;
const TRIGGER_GAP_PX = 2;
const ADMIN_HEADER_SAFE_TOP_PX = 68;
const CUSTOMER_COLUMN_CLASS =
  "min-w-[19rem] max-w-[min(30rem,40vw)] md:max-w-[min(26rem,36vw)]";
const TOTAL_COLUMN_CLASS = "w-[9.5rem] min-w-[9.5rem] max-w-[9.5rem]";
const STATUS_COLUMN_CLASS = "w-[13rem] min-w-[13rem] max-w-[13rem]";
const ITEMS_COLUMN_CLASS = "w-[10rem] min-w-[10rem] max-w-[10rem]";
const CREATED_AT_COLUMN_CLASS = "w-[12.75rem] min-w-[12.75rem] max-w-[12.75rem]";

const STATUS_BADGE_CLASSES: Record<SiteOrderStatus, string> = {
  confirmada: "bg-sky-50 text-sky-600 border border-sky-100",
  procesando: "bg-amber-50 text-amber-600 border border-amber-100",
  enviando: "bg-violet-50 text-violet-600 border border-violet-100",
  completada: "bg-emerald-50 text-emerald-600 border border-emerald-100",
};

const STATUS_MENU_ROW_CLASSES: Record<SiteOrderStatus, string> = {
  confirmada: "text-sky-700 hover:bg-sky-50/80",
  procesando: "text-amber-700 hover:bg-amber-50/80",
  enviando: "text-violet-700 hover:bg-violet-50/80",
  completada: "text-emerald-700 hover:bg-emerald-50/80",
};

const STATUS_MENU_ROW_ACTIVE_CLASSES: Record<SiteOrderStatus, string> = {
  confirmada: "bg-sky-50/90",
  procesando: "bg-amber-50/90",
  enviando: "bg-violet-50/90",
  completada: "bg-emerald-50/90",
};

function orderStatusBadgeClass(status: SiteOrderStatus) {
  return `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${STATUS_BADGE_CLASSES[status]}`;
}

function formatOrderDate(raw: string | null | undefined, locale: "es" | "en") {
  const formatted = formatStoreOrderDateTime(raw, locale);
  if (formatted == null) return <AdminTableEmptyEmDash />;
  return formatted;
}

function createdAtSortMs(row: AdminStoreOrderRow): number {
  const t = new Date(row.created_at).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function orderRowClassName(row: AdminStoreOrderRow): string {
  const base = "hover:bg-muted/50 transition-colors duration-150";

  if (row.status === "confirmada") {
    return cn(base, "shadow-[inset_2px_0_0_rgba(14,165,233,0.35)]");
  }
  if (row.status === "procesando") {
    return cn(base, "shadow-[inset_2px_0_0_rgba(245,158,11,0.35)]");
  }
  if (row.status === "enviando") {
    return cn(base, "shadow-[inset_2px_0_0_rgba(139,92,246,0.35)]");
  }
  return cn(base, "shadow-[inset_2px_0_0_rgba(16,185,129,0.35)]");
}

export function StoreOrdersTable({ orders }: { orders: AdminStoreOrderRow[] }) {
  const { t, locale } = useI18n();
  const statusLabels = useMemo<Record<SiteOrderStatus, string>>(
    () => ({
      confirmada: t("admin.orders.status.confirmada"),
      procesando: t("admin.orders.status.procesando"),
      enviando: t("admin.orders.status.enviando"),
      completada: t("admin.orders.status.completada"),
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
        { value: "all", label: t("admin.orders.filters.status.all") },
        ...statusSelectOptions,
      ] as const,
    [statusSelectOptions, t],
  );

  const [rows, setRows] = useState<AdminStoreOrderRow[]>(orders);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [openStatusMenuOrderId, setOpenStatusMenuOrderId] = useState<
    string | null
  >(null);
  const [openMobileStatusMenuOrderId, setOpenMobileStatusMenuOrderId] =
    useState<string | null>(null);
  const [statusMenuPos, setStatusMenuPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [itemsDialogOpen, setItemsDialogOpen] = useState(false);
  const [itemsModalOrderId, setItemsModalOrderId] = useState<string | null>(
    null,
  );
  const [itemsLoading, setItemsLoading] = useState(false);
  const [orderItems, setOrderItems] = useState<AdminStoreOrderItemRow[]>([]);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");

  useEffect(() => {
    setRows(orders);
  }, [orders]);

  const handleStatusChange = useCallback(
    async (orderId: string, nextStatus: SiteOrderStatus) => {
      setUpdating((prev) => ({ ...prev, [orderId]: true }));
      try {
        const res = await fetch("/api/admin/store-orders/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, status: nextStatus }),
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          throw new Error(
            payload?.error ?? t("admin.orders.toast.statusUpdateError"),
          );
        }
        setRows((prev) =>
          prev.map((row) =>
            row.id === orderId ? { ...row, status: nextStatus } : row,
          ),
        );
        toast.success(t("admin.orders.toast.statusUpdated"));
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t("admin.orders.toast.statusChangeError"),
        );
      } finally {
        setUpdating((prev) => ({ ...prev, [orderId]: false }));
        setOpenStatusMenuOrderId((current) =>
          current === orderId ? null : current,
        );
        setOpenMobileStatusMenuOrderId((current) =>
          current === orderId ? null : current,
        );
      }
    },
    [t],
  );

  const calculateStatusMenuPosition = useCallback((buttonEl: HTMLElement) => {
    const rect = buttonEl.getBoundingClientRect();
    const menuHeight = STATUS_MENU_ESTIMATED_HEIGHT_PX;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const left = Math.max(
      VIEWPORT_GUTTER_PX,
      Math.min(
        rect.right - STATUS_MENU_MIN_WIDTH_PX,
        viewportW - STATUS_MENU_MIN_WIDTH_PX - VIEWPORT_GUTTER_PX,
      ),
    );
    const spaceBelow = viewportH - rect.bottom - VIEWPORT_GUTTER_PX;
    const placeAbove = spaceBelow < menuHeight;
    const rawTop = placeAbove
      ? rect.top - menuHeight - TRIGGER_GAP_PX
      : rect.bottom + TRIGGER_GAP_PX;
    const top = Math.min(
      Math.max(ADMIN_HEADER_SAFE_TOP_PX, rawTop),
      viewportH - menuHeight - VIEWPORT_GUTTER_PX,
    );
    setStatusMenuPos({ top, left });
  }, []);

  useEffect(() => {
    if (!openStatusMenuOrderId) return;

    const onDocMouseDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const trigger = target.closest(
        `[data-status-menu-trigger="${openStatusMenuOrderId}"]`,
      );
      const menu = target.closest(
        `[data-status-menu-panel="${openStatusMenuOrderId}"]`,
      );
      if (!trigger && !menu) setOpenStatusMenuOrderId(null);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenStatusMenuOrderId(null);
    };

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openStatusMenuOrderId]);

  useEffect(() => {
    if (!openStatusMenuOrderId) {
      setStatusMenuPos(null);
      return;
    }
    const update = () => {
      const trigger = document.querySelector(
        `[data-status-menu-trigger="${openStatusMenuOrderId}"]`,
      );
      if (trigger instanceof HTMLElement) {
        calculateStatusMenuPosition(trigger);
      }
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [calculateStatusMenuPosition, openStatusMenuOrderId]);

  const handleShowItems = useCallback(async (orderId: string) => {
    setItemsModalOrderId(orderId);
    setItemsError(null);
    setItemsLoading(true);
    setItemsDialogOpen(true);
    try {
      const res = await fetch("/api/admin/store-orders/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.error ?? t("admin.orders.items.loadError"));
      }
      if (Array.isArray(payload?.items)) {
        setOrderItems(payload.items);
      } else {
        setOrderItems([]);
      }
    } catch (error) {
      setOrderItems([]);
      setItemsError(
        error instanceof Error
          ? error.message
          : t("admin.orders.items.loadError"),
      );
    } finally {
      setItemsLoading(false);
    }
  }, [t]);

  const closeItemsModal = useCallback(() => {
    setItemsDialogOpen(false);
    setItemsModalOrderId(null);
    setOrderItems([]);
    setItemsError(null);
    setItemsLoading(false);
  }, []);

  const filteredRows = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((order) => order.status === statusFilter);
  }, [rows, statusFilter]);

  const filterValue =
    statusFilterOptions.find((option) => option.value === statusFilter) ??
    statusFilterOptions[0];

  const columns = useMemo<ColumnDef<AdminStoreOrderRow>[]>(
    () => [
      {
        id: "customer",
        accessorFn: (row) =>
          `${row.customer_name} ${row.customer_email}`.trim(),
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          `${rowA.original.customer_name} ${rowA.original.customer_email}`
            .trim()
            .localeCompare(
              `${rowB.original.customer_name} ${rowB.original.customer_email}`.trim(),
              locale,
              { sensitivity: "base" },
            ),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.orders.table.customer")}
            ariaLabelIdle={t("admin.orders.table.customerSortIdle")}
            ariaLabelAsc={t("admin.orders.table.customerSortAsc")}
            ariaLabelDesc={t("admin.orders.table.customerSortDesc")}
          />
        ),
        meta: {
          cellClassName: CUSTOMER_COLUMN_CLASS,
        },
        cell: ({ row }) => {
          const name = row.original.customer_name?.trim();
          const email = row.original.customer_email?.trim();
          return (
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-foreground">
                {name || "—"}
              </p>
              {email ? (
                <p className="truncate text-sm text-muted-foreground">
                  {email}
                </p>
              ) : (
                <AdminTableEmptyEmDash className="text-sm" />
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "stripe_amount_total",
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          Number(rowA.original.stripe_amount_total ?? "0") -
          Number(rowB.original.stripe_amount_total ?? "0"),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.orders.table.total")}
            ariaLabelIdle={t("admin.orders.table.totalSortIdle")}
            ariaLabelAsc={t("admin.orders.table.totalSortAsc")}
            ariaLabelDesc={t("admin.orders.table.totalSortDesc")}
          />
        ),
        meta: {
          cellClassName: TOTAL_COLUMN_CLASS,
        },
        cell: ({ row }) => (
          <span className="font-semibold text-foreground">
            {formatUsd(Number(row.original.stripe_amount_total ?? "0"))}
          </span>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          STATUS_OPTIONS.indexOf(rowA.original.status) -
          STATUS_OPTIONS.indexOf(rowB.original.status),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.orders.table.status")}
            ariaLabelIdle={t("admin.orders.table.statusSortIdle")}
            ariaLabelAsc={t("admin.orders.table.statusSortAsc")}
            ariaLabelDesc={t("admin.orders.table.statusSortDesc")}
          />
        ),
        meta: {
          cellClassName: STATUS_COLUMN_CLASS,
        },
        cell: ({ row }) => {
          const rowId = row.original.id;
          const isUpdating = Boolean(updating[rowId]);
          return (
            <div className="relative flex items-center gap-2">
              {isUpdating ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("admin.orders.status.updating")}
                </span>
              ) : (
                <>
                  <span className={orderStatusBadgeClass(row.original.status)}>
                    {statusLabels[row.original.status]}
                  </span>
                  <TooltipProvider delayDuration={120}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition hover:border-foreground hover:text-foreground"
                          aria-label={t("admin.orders.table.changeStatus")}
                          data-status-menu-trigger={rowId}
                          onClick={(event) => {
                            const button = event.currentTarget;
                            setOpenStatusMenuOrderId((current) => {
                              const next = current === rowId ? null : rowId;
                              if (next) calculateStatusMenuPosition(button);
                              return next;
                            });
                          }}
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        align="center"
                        className="z-[120] rounded-xl border-border/60 bg-popover px-3 py-2 text-[11px] text-popover-foreground shadow-xl"
                      >
                        <span className="block font-medium">
                          {t("admin.orders.table.changeStatus")}
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
            </div>
          );
        },
      },
      {
        id: "items",
        header: () => (
          <span className="text-xs font-medium">{t("admin.orders.table.items")}</span>
        ),
        meta: {
          cellClassName: ITEMS_COLUMN_CLASS,
        },
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-full border-border/80 bg-background px-3 text-xs font-medium text-foreground shadow-sm transition hover:border-primary/40 hover:bg-primary/[0.06] hover:text-primary"
            onClick={() => void handleShowItems(row.original.id)}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            {t("admin.orders.table.viewItems")}
          </Button>
        ),
      },
      {
        id: "created_at",
        accessorKey: "created_at",
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          createdAtSortMs(rowA.original) - createdAtSortMs(rowB.original),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.orders.table.createdAt")}
            ariaLabelIdle={t("admin.orders.table.createdAtSortIdle")}
            ariaLabelAsc={t("admin.orders.table.createdAtSortAsc")}
            ariaLabelDesc={t("admin.orders.table.createdAtSortDesc")}
          />
        ),
        meta: {
          cellClassName: CREATED_AT_COLUMN_CLASS,
        },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap tabular-nums">
            {formatOrderDate(row.original.created_at, locale)}
          </span>
        ),
      },
    ],
    [handleShowItems, locale, statusLabels, t, updating],
  );

  const renderMobileRow = useCallback(
    (row: Row<AdminStoreOrderRow>) => {
      const order = row.original;
      const isUpdating = Boolean(updating[order.id]);
      return (
        <li
          key={row.id}
          className={cn(
            "relative min-w-0 rounded-xl border border-border/80 bg-card p-4 text-card-foreground transition-shadow duration-200 hover:shadow-sm",
            orderRowClassName(order),
          )}
        >
          <div className="space-y-3">
            <p className="truncate text-base font-semibold text-foreground">
              {order.customer_name?.trim() || "—"}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {order.customer_email?.trim() || "—"}
            </p>
            <p className="text-sm font-semibold text-foreground">
              {t("admin.orders.mobile.totalLabel")}:{" "}
              {formatUsd(Number(order.stripe_amount_total ?? "0"))}
            </p>
            <div className="flex items-center gap-2">
              <span className={orderStatusBadgeClass(order.status)}>
                {statusLabels[order.status]}
              </span>
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition hover:border-foreground hover:text-foreground"
                aria-label={t("admin.orders.table.changeStatus")}
                onClick={() =>
                  setOpenMobileStatusMenuOrderId((current) =>
                    current === order.id ? null : order.id,
                  )
                }
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            </div>
            {openMobileStatusMenuOrderId === order.id ? (
              <div className="overflow-hidden rounded-lg border border-border/80 bg-popover py-1">
                {STATUS_OPTIONS.map((status) => {
                  const active = order.status === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition",
                        STATUS_MENU_ROW_CLASSES[status],
                        active && STATUS_MENU_ROW_ACTIVE_CLASSES[status],
                        active && "font-semibold",
                      )}
                      onClick={() => {
                        setOpenMobileStatusMenuOrderId(null);
                        if (!active) void handleStatusChange(order.id, status);
                      }}
                    >
                      <span>{statusLabels[status]}</span>
                      {active ? (
                        <Check className="h-4 w-4 text-current" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-full border-border/80 bg-background px-3 text-xs font-medium text-foreground shadow-sm transition hover:border-primary/40 hover:bg-primary/[0.06] hover:text-primary"
                onClick={() => void handleShowItems(order.id)}
              >
                <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                {t("admin.orders.table.viewItems")}
              </Button>
            </div>
            <div className="space-y-1 border-t border-border/60 pt-3">
              <p className="text-sm text-muted-foreground">
                {t("admin.orders.mobile.orderDate")}
              </p>
              <p className="text-sm leading-snug text-foreground">
                {formatOrderDate(order.created_at, locale)}
              </p>
            </div>
          </div>
        </li>
      );
    },
    [openMobileStatusMenuOrderId, handleShowItems, handleStatusChange, locale, statusLabels, t, updating],
  );

  const toolbarFilters = useMemo(
    () => (
      <div className="flex w-full min-w-0 items-center gap-2">
        <div
          className={cn(
            "min-w-0 flex-1",
            "min-[1440px]:box-border min-[1440px]:w-[var(--orders-status-filter-w)] min-[1440px]:min-w-[var(--orders-status-filter-w)] min-[1440px]:max-w-[var(--orders-status-filter-w)] min-[1440px]:flex-none min-[1440px]:shrink-0",
          )}
          style={
            {
              ["--orders-status-filter-w" as string]: `${STORE_ORDERS_STATUS_FILTER_WIDE_CH}ch`,
            } as CSSProperties
          }
        >
          <Select
            instanceId="admin-orders-status-filter"
            options={statusFilterOptions}
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

  return (
    <>
      {typeof document !== "undefined" && openStatusMenuOrderId && statusMenuPos
        ? createPortal(
            <div
              className="fixed z-[100] w-[13rem] min-w-[13rem] overflow-hidden rounded-lg border border-border/80 bg-popover py-1 shadow-lg ring-1 ring-black/5"
              style={{ top: statusMenuPos.top, left: statusMenuPos.left }}
              data-status-menu-panel={openStatusMenuOrderId}
              role="menu"
            >
              {STATUS_OPTIONS.map((status) => {
                const order = rows.find(
                  (row) => row.id === openStatusMenuOrderId,
                );
                const active = order?.status === status;
                return (
                  <button
                    key={status}
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition",
                      STATUS_MENU_ROW_CLASSES[status],
                      active && STATUS_MENU_ROW_ACTIVE_CLASSES[status],
                      active && "font-semibold",
                    )}
                    onClick={() => {
                      setOpenStatusMenuOrderId(null);
                      if (!active)
                        void handleStatusChange(openStatusMenuOrderId, status);
                    }}
                  >
                    <span>{statusLabels[status]}</span>
                    {active ? <Check className="h-4 w-4 text-current" /> : null}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
      <DataTable
        columns={columns}
        data={filteredRows}
        enableSorting
        searchPlaceholder={t("admin.orders.filters.searchPlaceholder")}
        tableClassName="table-fixed"
        tableHeadCellClassName="!font-medium"
        tableBodyCellClassName="py-4"
        paginationClassName="border-border/50"
        paginationButtonVariant="ghost"
        getRowClassName={(row) => orderRowClassName(row)}
        toolbarFilters={toolbarFilters}
        renderMobileRow={renderMobileRow}
      />
      <Dialog
        open={itemsDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeItemsModal();
        }}
      >
        <DialogContent className="max-w-2xl gap-0 overflow-hidden border-border/60 p-0 shadow-xl ring-1 ring-black/[0.04]">
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
                  {t("admin.orders.items.title")}
                </DialogTitle>
                <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                  {itemsModalOrderId
                    ? (
                        <>
                          {t("admin.orders.items.orderPrefix")}{" "}
                          <span className="font-medium text-foreground">
                            {itemsModalOrderId}
                          </span>
                        </>
                      )
                    : t("admin.orders.items.description")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="max-h-[min(56vh,24rem)] space-y-3 overflow-y-auto px-6 py-5">
            {itemsLoading ? (
              <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("admin.orders.items.loading")}
              </div>
            ) : itemsError ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {itemsError}
              </p>
            ) : orderItems.length === 0 ? (
              <p className="rounded-lg border border-border/70 bg-muted/25 px-3 py-2 text-sm text-muted-foreground">
                {t("admin.orders.items.empty")}
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-primary/25 bg-primary/[0.03] shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-primary/[0.1] text-xs uppercase tracking-wide text-foreground/80">
                      <tr>
                        <th className="px-4 py-2.5 text-left">
                          {t("admin.orders.items.table.product")}
                        </th>
                        <th className="px-4 py-2.5 text-left">
                          {t("admin.orders.items.table.quantity")}
                        </th>
                        <th className="px-4 py-2.5 text-left">
                          {t("admin.orders.items.table.unitPrice")}
                        </th>
                        <th className="px-4 py-2.5 text-left">
                          {t("admin.orders.items.table.total")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item, index) => (
                        <tr
                          key={`${item.product_name}-${index}`}
                          className="border-t border-primary/15 transition hover:bg-primary/[0.07]"
                        >
                          <td className="px-4 py-2.5 font-medium">
                            {item.product_name}
                          </td>
                          <td className="px-4 py-2.5 text-left">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-2.5 text-left">
                            {formatUsd(Number(item.unit_price ?? "0"))}
                          </td>
                          <td className="px-4 py-2.5 text-left font-semibold text-foreground">
                            {formatUsd(Number(item.total_price ?? "0"))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
