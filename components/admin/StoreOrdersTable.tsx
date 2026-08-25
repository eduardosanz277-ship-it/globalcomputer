"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label, RequiredMark } from "@/components/ui/label";
import { AdminTableEmptyEmDash } from "@/components/admin/admin-table-empty";
import { OrderDetailsRecipientSection } from "@/components/orders/OrderDetailsRecipientSection";
import { OrderStatusHistoryTimeline } from "@/components/orders/OrderStatusHistoryTimeline";
import { ORDER_DETAILS_DIALOG_CONTENT_CLASSNAME } from "@/lib/order-details-dialog";
import {
  mapStoreOrderShippingAddressRow,
  type OrderShippingRecipient,
} from "@/lib/order-shipping-recipient";
import {
  AdminStoreOrderItemRow,
  AdminStoreOrderRow,
  type StoreOrderStatusHistoryRow,
} from "@/modules/commerce/store-orders.admin.service";
import { SiteOrderStatus } from "@/modules/commerce/store-orders.service";
import { translations } from "@/components/i18n/translations";
import { useNavBadges } from "@/components/admin/AdminNavBadgesContext";
import {
  Check,
  Edit3,
  Eye,
  FilterX,
  Hand,
  Loader2,
  Package,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { createPortal } from "react-dom";
import { formatStoreOrderDateTime } from "@/lib/store-order-datetime";
import { STORE_ORDERS_STATUS_FILTER_WIDE_CH } from "@/lib/store-orders-status-filter-width";

const STATUS_OPTIONS: SiteOrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipping",
  "completed",
  "cancelled",
];
const AUTOMATIC_STATUS_OPTIONS: SiteOrderStatus[] = STATUS_OPTIONS.filter(
  (status) => status !== "pending" && status !== "cancelled",
);
type StatusFilterValue = SiteOrderStatus | "all";
type ShippingMethodFilterValue = "all" | "automatic" | "manual";
const STATUS_MENU_MIN_WIDTH_PX = 208;
const STATUS_MENU_ESTIMATED_HEIGHT_PX = 248;
const VIEWPORT_GUTTER_PX = 8;
const TRIGGER_GAP_PX = 2;
const ADMIN_HEADER_SAFE_TOP_PX = 68;
const CUSTOMER_COLUMN_CLASS = "min-w-0 overflow-hidden";
const ORDER_NUMBER_COLUMN_CLASS =
  "w-[11.5rem] min-w-[11.5rem] max-w-[11.5rem] whitespace-nowrap";
const TOTAL_COLUMN_CLASS =
  "w-[8rem] min-w-[8rem] max-w-[8rem] whitespace-nowrap";
const SHIPPING_METHOD_COLUMN_CLASS =
  "w-[8.75rem] min-w-[8.75rem] max-w-[8.75rem] whitespace-nowrap";
const STATUS_COLUMN_CLASS =
  "w-[11.5rem] min-w-[11.5rem] max-w-[11.5rem] whitespace-nowrap";
const ITEMS_COLUMN_CLASS =
  "w-[9.25rem] min-w-[9.25rem] max-w-[9.25rem] whitespace-nowrap";
const CREATED_AT_COLUMN_CLASS =
  "w-[11.5rem] min-w-[11.5rem] max-w-[11.5rem] whitespace-nowrap";
const ORDERS_TABLE_MIN_WIDTH_CLASS = "min-w-[72rem]";

const STATUS_BADGE_CLASSES: Record<SiteOrderStatus, string> = {
  pending: "bg-slate-50 text-slate-700 border border-slate-200",
  confirmed: "bg-sky-50 text-sky-700 border border-sky-200",
  processing: "bg-amber-50 text-amber-700 border border-amber-200",
  shipping: "bg-violet-50 text-violet-700 border border-violet-200",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border border-red-200",
};

const STATUS_MENU_ROW_CLASSES: Record<SiteOrderStatus, string> = {
  pending: "text-slate-700 hover:bg-slate-50/80",
  confirmed: "text-sky-700 hover:bg-sky-50/80",
  processing: "text-amber-700 hover:bg-amber-50/80",
  shipping: "text-violet-700 hover:bg-violet-50/80",
  completed: "text-emerald-700 hover:bg-emerald-50/80",
  cancelled: "text-red-700 hover:bg-red-50/80",
};

const STATUS_MENU_ROW_ACTIVE_CLASSES: Record<SiteOrderStatus, string> = {
  pending: "bg-slate-50/90",
  confirmed: "bg-sky-50/90",
  processing: "bg-amber-50/90",
  shipping: "bg-violet-50/90",
  completed: "bg-emerald-50/90",
  cancelled: "bg-red-50/90",
};

function orderStatusBadgeClass(status: SiteOrderStatus) {
  return `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${STATUS_BADGE_CLASSES[status]}`;
}

const SHIPPING_METHOD_BADGE_CLASS =
  "inline-flex items-center gap-1 rounded-full border border-border bg-transparent px-2.5 py-1 text-xs font-semibold tracking-wide text-foreground/80";

const SHIPPING_METHOD_ICON_CLASS: Record<"automatic" | "manual", string> = {
  automatic: "text-[#2563EB]",
  manual: "text-[#D97706]",
};

function ShippingMethodBadge({
  method,
  label,
}: {
  method: "automatic" | "manual";
  label: string;
}) {
  const Icon = method === "automatic" ? Zap : Hand;
  return (
    <span className={SHIPPING_METHOD_BADGE_CLASS}>
      <Icon
        className={cn("h-3 w-3 shrink-0", SHIPPING_METHOD_ICON_CLASS[method])}
        strokeWidth={2.25}
        aria-hidden
      />
      {label}
    </span>
  );
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

function orderDisplayTotal(order: AdminStoreOrderRow): number {
  if (order.shipping_method === "manual") {
    return Number(order.total_amount ?? "0");
  }
  return Number(order.stripe_amount_total ?? "0");
}

function statusOptionsForOrder(
  order: Pick<AdminStoreOrderRow, "shipping_method" | "status">,
): SiteOrderStatus[] {
  if (order.shipping_method === "automatic") {
    return AUTOMATIC_STATUS_OPTIONS;
  }
  // Manual pendiente: solo confirmar (o cancelar). El resto exige haber confirmado.
  if (order.status === "pending") {
    return ["pending", "confirmed", "cancelled"];
  }
  return STATUS_OPTIONS;
}

function orderRowClassName(row: AdminStoreOrderRow): string {
  const base = "hover:bg-muted/50 transition-colors duration-150";

  if (row.inventory_status === "conflict") {
    return cn(
      base,
      "bg-amber-50/40 shadow-[inset_3px_0_0_rgba(217,119,6,0.7)]",
    );
  }
  if (row.status === "pending") {
    return cn(base, "shadow-[inset_2px_0_0_rgba(100,116,139,0.35)]");
  }
  if (row.status === "confirmed") {
    return cn(base, "shadow-[inset_2px_0_0_rgba(14,165,233,0.35)]");
  }
  if (row.status === "processing") {
    return cn(base, "shadow-[inset_2px_0_0_rgba(245,158,11,0.35)]");
  }
  if (row.status === "shipping") {
    return cn(base, "shadow-[inset_2px_0_0_rgba(139,92,246,0.35)]");
  }
  if (row.status === "cancelled") {
    return cn(base, "shadow-[inset_2px_0_0_rgba(239,68,68,0.35)]");
  }
  return cn(base, "shadow-[inset_2px_0_0_rgba(16,185,129,0.35)]");
}

export function StoreOrdersTable({ orders }: { orders: AdminStoreOrderRow[] }) {
  const { t, locale } = useI18n();
  const { decrementBadge } = useNavBadges();
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
  const shippingMethodLabels = useMemo(
    () => ({
      automatic: t("admin.orders.shippingMethod.automatic"),
      manual: t("admin.orders.shippingMethod.manual"),
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
  const shippingMethodFilterOptions = useMemo(
    () =>
      [
        {
          value: "all" as const,
          label: t("admin.orders.filters.shippingMethod.all"),
        },
        {
          value: "automatic" as const,
          label: shippingMethodLabels.automatic,
        },
        {
          value: "manual" as const,
          label: shippingMethodLabels.manual,
        },
      ] as const,
    [shippingMethodLabels, t],
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
  const [detailOrder, setDetailOrder] = useState<AdminStoreOrderRow | null>(
    null,
  );
  const [itemsLoading, setItemsLoading] = useState(false);
  const [orderItems, setOrderItems] = useState<AdminStoreOrderItemRow[]>([]);
  const [orderShippingAddress, setOrderShippingAddress] =
    useState<OrderShippingRecipient | null>(null);
  const [orderStatusHistory, setOrderStatusHistory] = useState<
    StoreOrderStatusHistoryRow[]
  >([]);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [shippingMethodFilter, setShippingMethodFilter] =
    useState<ShippingMethodFilterValue>("all");
  const [conflictFilter, setConflictFilter] = useState(false);
  const [conflictAction, setConflictAction] = useState<
    "refund" | "reprocess" | null
  >(null);
  const [conflictActionMsg, setConflictActionMsg] = useState<{
    type: "success" | "error" | "conflict";
    text: string;
  } | null>(null);
  const [confirmShippingOrder, setConfirmShippingOrder] =
    useState<AdminStoreOrderRow | null>(null);
  const [shippingAmountInput, setShippingAmountInput] = useState("");
  const [shippingAmountError, setShippingAmountError] = useState<string | null>(
    null,
  );
  const [confirmingShipping, setConfirmingShipping] = useState(false);

  useEffect(() => {
    setRows(orders);
  }, [orders]);

  const closeConfirmShippingModal = useCallback(() => {
    if (confirmingShipping) return;
    setConfirmShippingOrder(null);
    setShippingAmountInput("");
    setShippingAmountError(null);
  }, [confirmingShipping]);

  const handleStatusChange = useCallback(
    async (
      orderId: string,
      nextStatus: SiteOrderStatus,
      amountShipping?: number,
    ) => {
      setUpdating((prev) => ({ ...prev, [orderId]: true }));
      try {
        const res = await fetch("/api/admin/store-orders/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            status: nextStatus,
            ...(typeof amountShipping === "number" ? { amountShipping } : {}),
          }),
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          if (payload?.code === "SHIPPING_AMOUNT_REQUIRED") {
            throw new Error(t("admin.orders.toast.shippingRequired"));
          }
          if (payload?.code === "STATUS_NOT_ALLOWED") {
            throw new Error(t("admin.orders.toast.statusNotAllowed"));
          }
          if (payload?.code === "MANUAL_CONFIRM_REQUIRED") {
            throw new Error(t("admin.orders.toast.manualConfirmRequired"));
          }
          throw new Error(
            payload?.error ?? t("admin.orders.toast.statusUpdateError"),
          );
        }
        const payload = (await res.json().catch(() => null)) as {
          order?: {
            status: SiteOrderStatus;
            amount_shipping: string;
            total_amount: string;
          };
        } | null;
        setRows((prev) =>
          prev.map((row) =>
            row.id === orderId
              ? {
                  ...row,
                  status: payload?.order?.status ?? nextStatus,
                  amount_shipping:
                    payload?.order?.amount_shipping ?? row.amount_shipping,
                  total_amount:
                    payload?.order?.total_amount ?? row.total_amount,
                }
              : row,
          ),
        );
        toast.success(t("admin.orders.toast.statusUpdated"));
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t("admin.orders.toast.statusChangeError"),
        );
        throw error;
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

  const requestStatusChange = useCallback(
    (orderId: string, nextStatus: SiteOrderStatus) => {
      const order = rows.find((row) => row.id === orderId);
      if (
        order &&
        order.status === "pending" &&
        order.shipping_method === "manual" &&
        nextStatus === "confirmed"
      ) {
        setConfirmShippingOrder(order);
        setShippingAmountInput("");
        setShippingAmountError(null);
        setOpenStatusMenuOrderId(null);
        setOpenMobileStatusMenuOrderId(null);
        return;
      }
      void handleStatusChange(orderId, nextStatus).catch(() => undefined);
    },
    [handleStatusChange, rows],
  );

  const handleConfirmShippingSubmit = useCallback(async () => {
    if (!confirmShippingOrder) return;
    const parsed = Number(shippingAmountInput.replace(",", ".").trim());
    if (!Number.isFinite(parsed)) {
      setShippingAmountError(t("admin.orders.confirmShipping.shippingInvalid"));
      return;
    }
    if (parsed <= 0) {
      setShippingAmountError(
        t("admin.orders.confirmShipping.shippingRequired"),
      );
      return;
    }
    const amountShipping = Number(parsed.toFixed(2));
    setShippingAmountError(null);
    setConfirmingShipping(true);
    try {
      await handleStatusChange(
        confirmShippingOrder.id,
        "confirmed",
        amountShipping,
      );
      setConfirmShippingOrder(null);
      setShippingAmountInput("");
    } catch {
      // toast already shown in handleStatusChange
    } finally {
      setConfirmingShipping(false);
    }
  }, [confirmShippingOrder, handleStatusChange, shippingAmountInput, t]);

  const confirmShippingPreviewTotal = useMemo(() => {
    if (!confirmShippingOrder) return null;
    const currentTotal = Number(confirmShippingOrder.total_amount ?? 0);
    const parsed = Number(shippingAmountInput.replace(",", ".").trim());
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    return Number((currentTotal + parsed).toFixed(2));
  }, [confirmShippingOrder, shippingAmountInput]);

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

  const handleShowItems = useCallback(
    async (order: AdminStoreOrderRow) => {
      setDetailOrder(order);
      setItemsError(null);
      setOrderShippingAddress(null);
      setOrderStatusHistory([]);
      setItemsLoading(true);
      setItemsDialogOpen(true);
      try {
        const res = await fetch("/api/admin/store-orders/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id }),
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
        setOrderShippingAddress(
          mapStoreOrderShippingAddressRow(payload?.shippingAddress ?? null),
        );
        setOrderStatusHistory(
          Array.isArray(payload?.statusHistory) ? payload.statusHistory : [],
        );
      } catch (error) {
        setOrderItems([]);
        setOrderShippingAddress(null);
        setOrderStatusHistory([]);
        setItemsError(
          error instanceof Error
            ? error.message
            : t("admin.orders.items.loadError"),
        );
      } finally {
        setItemsLoading(false);
      }
    },
    [t],
  );

  const closeItemsModal = useCallback(() => {
    setItemsDialogOpen(false);
    setDetailOrder(null);
    setOrderItems([]);
    setOrderShippingAddress(null);
    setOrderStatusHistory([]);
    setItemsError(null);
    setItemsLoading(false);
    setConflictAction(null);
    setConflictActionMsg(null);
  }, []);

  const handleConflictRefund = useCallback(async () => {
    if (!detailOrder) return;
    setConflictAction("refund");
    setConflictActionMsg(null);
    try {
      const res = await fetch("/api/admin/store-orders/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: detailOrder.id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setConflictActionMsg({
          type: "error",
          text:
            data?.error ?? t("admin.orders.conflictResolution.errorGeneric"),
        });
        return;
      }
      setConflictActionMsg({
        type: "success",
        text: t("admin.orders.conflictResolution.refundSuccess"),
      });
      setRows((prev) => {
        const updated = prev.map((row) =>
          row.id === detailOrder.id
            ? { ...row, status: "cancelled" as const, inventory_status: null }
            : row,
        );
        const remainingConflicts = updated.filter(
          (r) => r.inventory_status === "conflict",
        ).length;
        if (remainingConflicts === 0) setConflictFilter(false);
        return updated;
      });
      setDetailOrder((prev) =>
        prev
          ? { ...prev, status: "cancelled" as const, inventory_status: null }
          : prev,
      );
      setOrderStatusHistory((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          status: "cancelled",
          previousStatus: detailOrder.status,
          changedByName: null,
          note:
            locale === "en"
              ? "Refund issued due to inventory conflict."
              : "Reembolso emitido por conflicto de inventario.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch {
      setConflictActionMsg({
        type: "error",
        text: t("admin.orders.conflictResolution.errorGeneric"),
      });
    } finally {
      setConflictAction(null);
    }
  }, [detailOrder, locale, t]);

  const handleConflictReprocess = useCallback(async () => {
    if (!detailOrder) return;
    setConflictAction("reprocess");
    setConflictActionMsg(null);
    try {
      const res = await fetch("/api/admin/store-orders/reprocess-inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: detailOrder.id }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 409 && data?.code === "STILL_CONFLICT") {
        setConflictActionMsg({
          type: "conflict",
          text: t("admin.orders.conflictResolution.reprocessStillConflict"),
        });
        return;
      }
      if (!res.ok) {
        setConflictActionMsg({
          type: "error",
          text:
            data?.error ?? t("admin.orders.conflictResolution.errorGeneric"),
        });
        return;
      }
      setConflictActionMsg({
        type: "success",
        text: t("admin.orders.conflictResolution.reprocessSuccess"),
      });
      setRows((prev) => {
        const updated = prev.map((row) =>
          row.id === detailOrder.id
            ? { ...row, inventory_status: "processed" as const }
            : row,
        );
        const remainingConflicts = updated.filter(
          (r) => r.inventory_status === "conflict",
        ).length;
        if (remainingConflicts === 0) setConflictFilter(false);
        return updated;
      });
      setDetailOrder((prev) =>
        prev ? { ...prev, inventory_status: "processed" as const } : prev,
      );
      // No se agrega entrada de historial: el estado del pedido no cambia.
      // El reproceso es una corrección administrativa del inventario; la fecha
      // y entrada "Confirmado" original permanecen intactas.
    } catch {
      setConflictActionMsg({
        type: "error",
        text: t("admin.orders.conflictResolution.errorGeneric"),
      });
    } finally {
      setConflictAction(null);
    }
  }, [detailOrder, locale, t]);

  const conflictCount = useMemo(
    () => rows.filter((r) => r.inventory_status === "conflict").length,
    [rows],
  );

  // Sync the sidebar badge whenever the local conflictCount changes.
  // Using a ref to track the previous value avoids calling decrementBadge
  // on the initial render (where no conflict has been resolved yet) and
  // prevents the double-invocation issue that arises when decrementBadge
  // is called inside a setRows functional updater (React Strict Mode runs
  // updaters twice for side-effect detection, causing badge to drop by 2).
  const prevConflictCountRef = useRef<number | null>(null);
  useEffect(() => {
    if (
      prevConflictCountRef.current !== null &&
      conflictCount < prevConflictCountRef.current
    ) {
      const resolved = prevConflictCountRef.current - conflictCount;
      decrementBadge("/admin/orders", resolved);
    }
    prevConflictCountRef.current = conflictCount;
  }, [conflictCount, decrementBadge]);

  const filteredRows = useMemo(() => {
    return rows.filter((order) => {
      if (conflictFilter && order.inventory_status !== "conflict") return false;
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }
      if (
        shippingMethodFilter !== "all" &&
        order.shipping_method !== shippingMethodFilter
      ) {
        return false;
      }
      return true;
    });
  }, [conflictFilter, rows, shippingMethodFilter, statusFilter]);

  const filterValue =
    statusFilterOptions.find((option) => option.value === statusFilter) ??
    statusFilterOptions[0];
  const shippingMethodFilterValue =
    shippingMethodFilterOptions.find(
      (option) => option.value === shippingMethodFilter,
    ) ?? shippingMethodFilterOptions[0];
  const filtersAreDefault =
    statusFilter === "all" && shippingMethodFilter === "all" && !conflictFilter;
  const clearFilters = useCallback(() => {
    setStatusFilter("all");
    setShippingMethodFilter("all");
    setConflictFilter(false);
  }, []);

  const columns = useMemo<ColumnDef<AdminStoreOrderRow>[]>(
    () => [
      {
        id: "order_number",
        accessorKey: "order_number",
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          rowA.original.order_number.localeCompare(rowB.original.order_number),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.orders.table.orderNumber")}
            ariaLabelIdle={t("admin.orders.table.orderNumberSortIdle")}
            ariaLabelAsc={t("admin.orders.table.orderNumberSortAsc")}
            ariaLabelDesc={t("admin.orders.table.orderNumberSortDesc")}
          />
        ),
        meta: {
          cellClassName: ORDER_NUMBER_COLUMN_CLASS,
        },
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium tabular-nums text-foreground">
            {row.original.order_number}
          </span>
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
              <p className="truncate text-sm font-semibold text-foreground">
                {name || "—"}
              </p>
              {email ? (
                <p className="truncate text-xs text-muted-foreground">
                  {email}
                </p>
              ) : (
                <AdminTableEmptyEmDash className="text-xs" />
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "total_amount",
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          orderDisplayTotal(rowA.original) - orderDisplayTotal(rowB.original),
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
          <span className="block truncate font-semibold tabular-nums text-foreground">
            {formatUsd(orderDisplayTotal(row.original))}
          </span>
        ),
      },
      {
        id: "shipping_method",
        accessorKey: "shipping_method",
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          rowA.original.shipping_method.localeCompare(
            rowB.original.shipping_method,
          ),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.orders.table.shippingMethod")}
            ariaLabelIdle={t("admin.orders.table.shippingMethodSortIdle")}
            ariaLabelAsc={t("admin.orders.table.shippingMethodSortAsc")}
            ariaLabelDesc={t("admin.orders.table.shippingMethodSortDesc")}
          />
        ),
        meta: {
          cellClassName: SHIPPING_METHOD_COLUMN_CLASS,
        },
        cell: ({ row }) => (
          <ShippingMethodBadge
            method={row.original.shipping_method}
            label={shippingMethodLabels[row.original.shipping_method]}
          />
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
        id: "details",
        header: t("admin.orders.table.items"),
        meta: {
          cellClassName: ITEMS_COLUMN_CLASS,
        },
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            type="button"
            className="h-8 rounded-full border-border/80 bg-background px-3 text-xs font-medium text-foreground shadow-sm transition hover:border-primary/40 hover:bg-primary/[0.06] hover:text-primary"
            onClick={() => void handleShowItems(row.original)}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            {t("admin.orders.table.viewItems")}
          </Button>
        ),
      },
    ],
    [handleShowItems, locale, shippingMethodLabels, statusLabels, t, updating],
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
            <div className="space-y-0.5">
              <p className="font-mono text-sm font-medium tabular-nums text-foreground">
                {order.order_number}
              </p>
              <p className="text-sm text-muted-foreground tabular-nums">
                {formatOrderDate(order.created_at, locale)}
              </p>
            </div>
            <p className="truncate text-sm font-semibold text-foreground">
              {order.customer_name?.trim() || "—"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {order.customer_email?.trim() || "—"}
            </p>
            <p className="text-sm font-semibold text-foreground">
              {t("admin.orders.mobile.totalLabel")}:{" "}
              {formatUsd(orderDisplayTotal(order))}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("admin.orders.mobile.shippingMethodLabel")}:{" "}
              <ShippingMethodBadge
                method={order.shipping_method}
                label={shippingMethodLabels[order.shipping_method]}
              />
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
                {statusOptionsForOrder(order).map((status) => {
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
                        if (!active) requestStatusChange(order.id, status);
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
                onClick={() => void handleShowItems(order)}
              >
                <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                {t("admin.orders.table.viewItems")}
              </Button>
            </div>
          </div>
        </li>
      );
    },
    [
      openMobileStatusMenuOrderId,
      handleShowItems,
      requestStatusChange,
      locale,
      shippingMethodLabels,
      statusLabels,
      t,
      updating,
    ],
  );

  const toolbarFilters = useMemo(
    () => (
      <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:flex-nowrap">
        <div
          className={cn(
            "min-w-0 flex-1 basis-[min(100%,12rem)]",
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
        <div
          className={cn(
            "min-w-0 flex-1 basis-[min(100%,12rem)]",
            "min-[1440px]:box-border min-[1440px]:w-[var(--orders-status-filter-w)] min-[1440px]:min-w-[var(--orders-status-filter-w)] min-[1440px]:max-w-[var(--orders-status-filter-w)] min-[1440px]:flex-none min-[1440px]:shrink-0",
          )}
          style={
            {
              ["--orders-status-filter-w" as string]: `${STORE_ORDERS_STATUS_FILTER_WIDE_CH}ch`,
            } as CSSProperties
          }
        >
          <Select
            instanceId="admin-orders-shipping-method-filter"
            options={[...shippingMethodFilterOptions]}
            styles={appToolbarSelectStyles}
            value={shippingMethodFilterValue}
            isSearchable={false}
            isClearable={false}
            onChange={(option) => {
              if (!option) return;
              setShippingMethodFilter(option.value);
            }}
            className="w-full min-w-0"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 border-border/80 text-muted-foreground hover:text-foreground"
          disabled={filtersAreDefault}
          onClick={clearFilters}
          title={t("admin.orders.filters.clear")}
          aria-label={t("admin.orders.filters.clearAria")}
        >
          <FilterX className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    ),
    [
      clearFilters,
      filterValue,
      filtersAreDefault,
      shippingMethodFilterOptions,
      shippingMethodFilterValue,
      statusFilterOptions,
      t,
    ],
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
              {(() => {
                const order = rows.find(
                  (row) => row.id === openStatusMenuOrderId,
                );
                if (!order) return null;
                return statusOptionsForOrder(order).map((status) => {
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
                        setOpenStatusMenuOrderId(null);
                        if (!active)
                          requestStatusChange(openStatusMenuOrderId, status);
                      }}
                    >
                      <span>{statusLabels[status]}</span>
                      {active ? (
                        <Check className="h-4 w-4 text-current" />
                      ) : null}
                    </button>
                  );
                });
              })()}
            </div>,
            document.body,
          )
        : null}
      {conflictCount > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-2">
          <div className="flex min-w-0 items-start gap-3">
            <TriangleAlert
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-900">
                {translations[locale].admin.orders.filters.conflictBanner.title(
                  conflictCount,
                )}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-amber-800">
                {t("admin.orders.filters.conflictBanner.description")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConflictFilter((v) => !v)}
            className={cn(
              "self-start min-w-[9rem] shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ml-8 lg:ml-0 lg:self-auto",
              conflictFilter
                ? "border-amber-400 bg-amber-200 text-amber-900 hover:bg-amber-300"
                : "border-amber-400 bg-white text-amber-800 hover:bg-amber-100",
            )}
          >
            {conflictFilter
              ? t("admin.orders.filters.conflictBanner.clearFilterButton")
              : t("admin.orders.filters.conflictBanner.filterButton")}
          </button>
        </div>
      ) : null}
      <DataTable
        columns={columns}
        data={filteredRows}
        enableSorting
        searchPlaceholder={t("admin.orders.filters.searchPlaceholder")}
        tableClassName={`table-fixed ${ORDERS_TABLE_MIN_WIDTH_CLASS}`}
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
                  {t("profile.dialogOrderDetailsTitle")}
                </DialogTitle>
                {detailOrder ? (
                  <DialogDescription asChild>
                    <div className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
                      <p>
                        {t("admin.orders.items.orderPrefix")}{" "}
                        <span className="font-mono font-medium text-foreground">
                          {detailOrder.order_number}
                        </span>
                      </p>
                      <p>
                        {t("profile.dialogDateLabel")}{" "}
                        <span className="font-medium text-foreground tabular-nums">
                          {formatOrderDate(detailOrder.created_at, locale)}
                        </span>
                      </p>
                      <p className="flex flex-wrap items-center gap-2">
                        <span>{t("profile.dialogStatusLabel")}:</span>
                        <span
                          className={cn(
                            "inline-flex",
                            orderStatusBadgeClass(detailOrder.status),
                          )}
                        >
                          {statusLabels[detailOrder.status]}
                        </span>
                      </p>
                    </div>
                  </DialogDescription>
                ) : (
                  <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                    {t("admin.orders.items.description")}
                  </DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>
          <div className="max-h-[min(70vh,32rem)] space-y-5 overflow-y-auto px-6 py-5">
            {itemsLoading ? (
              <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("admin.orders.items.loading")}
              </div>
            ) : itemsError ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {itemsError}
              </p>
            ) : detailOrder ? (
              <>
                {orderItems.length === 0 ? (
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
                              <td className="px-4 py-2.5 tabular-nums">
                                {item.quantity}
                              </td>
                              <td className="px-4 py-2.5 tabular-nums">
                                {formatUsd(Number(item.unit_price ?? "0"))}
                              </td>
                              <td className="px-4 py-2.5 font-semibold tabular-nums text-foreground">
                                {formatUsd(Number(item.total_price ?? "0"))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <OrderDetailSummaryTile title={t("profile.summarySubtotal")}>
                    {formatUsd(Number(detailOrder.amount_subtotal ?? 0))}
                  </OrderDetailSummaryTile>
                  <OrderDetailSummaryTile title={t("profile.summaryDiscount")}>
                    {Number(detailOrder.amount_discount ?? 0) > 0
                      ? `−${formatUsd(Number(detailOrder.amount_discount ?? 0))}`
                      : formatUsd(0)}
                  </OrderDetailSummaryTile>
                  <OrderDetailSummaryTile title={t("profile.summaryTax")}>
                    {formatUsd(Number(detailOrder.amount_tax ?? 0))}
                  </OrderDetailSummaryTile>
                  <OrderDetailSummaryTile title={t("profile.summaryShipping")}>
                    {formatUsd(Number(detailOrder.amount_shipping ?? 0))}
                  </OrderDetailSummaryTile>
                  <OrderDetailSummaryTile title={t("profile.summaryTotal")}>
                    {formatUsd(orderDisplayTotal(detailOrder))}
                  </OrderDetailSummaryTile>
                </div>

                {orderShippingAddress ? (
                  <OrderDetailsRecipientSection
                    recipient={orderShippingAddress}
                  />
                ) : null}

                <OrderStatusHistoryTimeline
                  entries={orderStatusHistory}
                  statusLabels={statusLabels}
                  statusBadgeClass={orderStatusBadgeClass}
                />

                {detailOrder.inventory_status === "conflict" ? (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
                    <div className="mb-3 flex items-start gap-2.5">
                      <TriangleAlert
                        className="mt-0.5 h-4.5 w-4.5 shrink-0 text-amber-600"
                        aria-hidden
                      />
                      <div>
                        <p className="text-sm font-semibold text-amber-900">
                          {t("admin.orders.conflictResolution.title")}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-amber-700">
                          {t("admin.orders.conflictResolution.description")}
                        </p>
                      </div>
                    </div>
                    {conflictActionMsg ? (
                      <p
                        className={cn(
                          "mb-3 ml-7 rounded-lg px-3 py-2 text-xs font-medium",
                          conflictActionMsg.type === "success"
                            ? "bg-green-100 text-green-800"
                            : conflictActionMsg.type === "conflict"
                              ? "bg-amber-100 text-amber-900"
                              : "bg-red-50 text-red-700",
                        )}
                      >
                        {conflictActionMsg.text}
                      </p>
                    ) : null}
                    {conflictActionMsg?.type !== "success" ? (
                      <div className="ml-7 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        {detailOrder.stripe_session_id ? (
                          <button
                            type="button"
                            disabled={conflictAction !== null}
                            onClick={handleConflictRefund}
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 sm:w-auto sm:justify-start"
                          >
                            {conflictAction === "refund" ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                {t(
                                  "admin.orders.conflictResolution.refundingButton",
                                )}
                              </>
                            ) : (
                              t("admin.orders.conflictResolution.refundButton")
                            )}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={conflictAction !== null}
                          onClick={handleConflictReprocess}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50 sm:w-auto sm:justify-start"
                        >
                          {conflictAction === "reprocess" ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              {t(
                                "admin.orders.conflictResolution.reprocessingButton",
                              )}
                            </>
                          ) : (
                            t("admin.orders.conflictResolution.reprocessButton")
                          )}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("profile.dialogLoadingDetails")}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(confirmShippingOrder)}
        onOpenChange={(open) => {
          if (!open) closeConfirmShippingModal();
        }}
      >
        <DialogContent className="w-[calc(100vw-1.75rem)] max-w-none rounded-lg gap-0 overflow-hidden border-border/60 p-0 shadow-xl ring-1 ring-black/[0.04] sm:w-full sm:max-w-[24rem] md:max-w-[26rem] lg:max-w-[28rem]">
          <DialogHeader className="space-y-0 border-b border-border/60 bg-muted/25 px-4 pb-4 pt-5 text-left sm:px-5 sm:pb-4 sm:pt-5">
            <div className="min-w-0 space-y-1.5 pr-8">
              <DialogTitle className="text-base font-semibold leading-tight tracking-tight text-foreground sm:text-[1.05rem]">
                {t("admin.orders.confirmShipping.title")}
              </DialogTitle>
              <DialogDescription className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {confirmShippingOrder ? (
                  <>
                    {t("admin.orders.confirmShipping.orderPrefix")}{" "}
                    <span className="font-mono font-medium text-foreground">
                      {confirmShippingOrder.order_number}
                    </span>
                    <span className="mt-1.5 block">
                      {t("admin.orders.confirmShipping.description")}
                    </span>
                  </>
                ) : (
                  t("admin.orders.confirmShipping.description")
                )}
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="space-y-3 px-4 py-4 sm:space-y-3.5 sm:px-5 sm:py-4">
            <div className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/25 px-2.5 py-2 text-xs sm:gap-3 sm:px-3 sm:text-sm">
              <span className="text-muted-foreground">
                {t("admin.orders.confirmShipping.currentTotal")}
              </span>
              <span className="shrink-0 font-semibold text-foreground">
                {formatUsd(Number(confirmShippingOrder?.total_amount ?? 0))}
              </span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-shipping-amount">
                {t("admin.orders.confirmShipping.shippingAmount")}
                <RequiredMark />
              </Label>
              <Input
                id="confirm-shipping-amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={shippingAmountInput}
                placeholder={t(
                  "admin.orders.confirmShipping.shippingAmountPlaceholder",
                )}
                disabled={confirmingShipping}
                onChange={(event) => {
                  setShippingAmountInput(event.target.value);
                  if (shippingAmountError) setShippingAmountError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleConfirmShippingSubmit();
                  }
                }}
              />
              {shippingAmountError ? (
                <p className="text-sm text-destructive">
                  {shippingAmountError}
                </p>
              ) : null}
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/25 bg-primary/[0.03] px-2.5 py-2 text-xs sm:gap-3 sm:px-3 sm:text-sm">
              <span className="text-muted-foreground">
                {t("admin.orders.confirmShipping.newTotal")}
              </span>
              <span className="shrink-0 font-semibold text-foreground">
                {confirmShippingPreviewTotal != null
                  ? formatUsd(confirmShippingPreviewTotal)
                  : "—"}
              </span>
            </div>
          </div>
          <DialogFooter className="border-t border-border/60 bg-muted/15 px-4 py-3 sm:px-5 sm:py-3.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              disabled={confirmingShipping}
              onClick={closeConfirmShippingModal}
            >
              {t("admin.orders.confirmShipping.cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              className="w-full sm:w-auto"
              disabled={confirmingShipping}
              onClick={() => void handleConfirmShippingSubmit()}
            >
              {confirmingShipping ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("admin.orders.confirmShipping.confirming")}
                </>
              ) : (
                t("admin.orders.confirmShipping.confirm")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function OrderDetailSummaryTile({
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
