"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import type { ShippingRate } from "@/modules/shipping/shipping.types";
import {
  deleteShippingRateAdminAction,
  setShippingRateActiveAdminAction,
} from "@/modules/shipping/shipping.actions";
import { SortableHeader } from "@/components/admin/admin-sortable-table-header";
import { AdminEditDeleteRowMenu } from "@/components/admin/admin-edit-delete-row-menu";
import { ShippingRateProfileCard } from "@/components/dashboard/shipping-rate-profile-card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useI18n } from "@/components/i18n/I18nProvider";
import { useServerAction } from "@/hooks/use-server-action";
import { bindAdminAction } from "@/lib/admin/bind-admin-action";
import { formatUsd } from "@/components/store/store-cart-format";
import { cn } from "@/utils/cn";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { formatRelativeLastAccess } from "@/utils/formatRelativeLastAccess";
import { swalSaasConfirmAsync } from "@/utils/swal-saas";
import { ShippingRateFormDialog } from "./ShippingRateFormDialog";

type Props = {
  rates: ShippingRate[];
  isLoading?: boolean;
};

/**
 * `min-width` del botón «Nueva» calibrado con el copy en español
 * e icono, para que el ancho no dependa de "New" frente a "Nueva".
 */
const NEW_BUTTON_MIN_W_CLASS = "min-w-[6.5rem]";
const UPDATED_AT_COLUMN_CLASS = "w-[13rem] min-w-[13rem] max-w-[13rem]";

function updatedAtSortMs(row: ShippingRate): number {
  const t = new Date(row.updatedAt).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function ShippingRateRowActions({
  rate,
  onEdit,
}: {
  rate: ShippingRate;
  onEdit: () => void;
}) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { executeAsync, isPending } = useServerAction(
    bindAdminAction(deleteShippingRateAdminAction, locale),
    {
      successMessage: t("admin.shipping.rates.toast.deleted"),
      errorMessage: t("admin.shipping.rates.toast.deleteError"),
      onSuccess: () => {
        router.refresh();
      },
    },
  );

  const handleDelete = async () => {
    await swalSaasConfirmAsync({
      title: t("admin.shipping.rates.confirm.deleteTitle"),
      html: t("admin.shipping.rates.confirm.deleteMessage")
        .replace("{from}", formatUsd(rate.minAmount))
        .replace("{to}", formatUsd(rate.maxAmount)),
      confirmButtonText: t("admin.shipping.rates.confirm.deleteConfirm"),
      cancelButtonText: t("admin.shipping.rates.form.cancel"),
      loadingConfirmText: t("admin.shipping.rates.confirm.deleteDeleting"),
      variant: "destructive",
      iconType: "warning",
      preConfirm: () => executeAsync(rate.id),
    });
  };

  return (
    <AdminEditDeleteRowMenu
      onEdit={onEdit}
      onDelete={() => void handleDelete()}
      isDeleting={isPending}
      deleteLabel={t("admin.shipping.rates.confirm.deleteConfirm")}
      deletingLabel={t("admin.shipping.rates.confirm.deleteDeleting")}
    />
  );
}

export function AdminShippingRatesTable({
  rates,
  isLoading = false,
}: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ShippingRate | null>(null);
  /** Mientras haya petición + refresh: el Switch no cambia hasta que `rates` tenga el valor guardado. */
  const [pendingActive, setPendingActive] = useState<{
    id: string;
    target: boolean;
  } | null>(null);

  const { executeAsync: executeToggle } = useServerAction(
    bindAdminAction(setShippingRateActiveAdminAction, locale),
    {
      errorMessage: t("admin.shipping.rates.toast.updateError"),
    },
  );

  useEffect(() => {
    if (!pendingActive) return;
    const row = rates.find((r) => r.id === pendingActive.id);
    if (row && row.active === pendingActive.target) {
      setPendingActive(null);
    }
  }, [rates, pendingActive]);

  const handleActiveChange = useCallback(
    async (id: string, checked: boolean) => {
      setPendingActive({ id, target: checked });
      try {
        await executeToggle(id, checked);
        startTransition(() => {
          router.refresh();
        });
      } catch {
        setPendingActive(null);
      }
    },
    [executeToggle, router, startTransition],
  );

  const openCreate = useCallback(() => {
    setEditing(null);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((rate: ShippingRate) => {
    setEditing(rate);
    setDialogOpen(true);
  }, []);

  /** Posición 1…n según Desde ASC (independiente del sort interactivo). */
  const orderByRateId = useMemo(() => {
    const sorted = [...rates].sort(
      (a, b) => a.minAmount - b.minAmount || a.maxAmount - b.maxAmount,
    );
    const map = new Map<string, number>();
    sorted.forEach((rate, index) => {
      map.set(rate.id, index + 1);
    });
    return map;
  }, [rates]);

  const columns = useMemo<ColumnDef<ShippingRate>[]>(
    () => [
      {
        id: "sortOrder",
        accessorFn: (row) => orderByRateId.get(row.id) ?? 0,
        enableSorting: false,
        header: t("admin.shipping.rates.table.sortOrder"),
        meta: { cellClassName: "w-[4.5rem] min-w-[4.5rem]" },
        cell: ({ row }) => (
          <span className="tabular-nums text-sm text-muted-foreground">
            {orderByRateId.get(row.original.id) ?? "—"}
          </span>
        ),
      },
      {
        id: "minAmount",
        accessorKey: "minAmount",
        enableSorting: true,
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.shipping.rates.table.from")}
            ariaLabelIdle={t("admin.shipping.rates.table.from")}
            ariaLabelAsc={t("admin.shipping.rates.table.from")}
            ariaLabelDesc={t("admin.shipping.rates.table.from")}
          />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums text-sm">
            {formatUsd(row.original.minAmount)}
          </span>
        ),
      },
      {
        id: "maxAmount",
        accessorKey: "maxAmount",
        enableSorting: true,
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.shipping.rates.table.to")}
            ariaLabelIdle={t("admin.shipping.rates.table.to")}
            ariaLabelAsc={t("admin.shipping.rates.table.to")}
            ariaLabelDesc={t("admin.shipping.rates.table.to")}
          />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums text-sm">
            {formatUsd(row.original.maxAmount)}
          </span>
        ),
      },
      {
        id: "cost",
        accessorKey: "cost",
        enableSorting: true,
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.shipping.rates.table.cost")}
            ariaLabelIdle={t("admin.shipping.rates.table.cost")}
            ariaLabelAsc={t("admin.shipping.rates.table.cost")}
            ariaLabelDesc={t("admin.shipping.rates.table.cost")}
          />
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium tabular-nums">
            {formatUsd(row.original.cost)}
          </span>
        ),
      },
      {
        id: "active",
        accessorKey: "active",
        header: t("admin.shipping.rates.table.active"),
        meta: { cellClassName: "w-[6.5rem] min-w-[6.5rem]" },
        cell: ({ row }) => {
          const id = row.original.id;
          const busy = pendingActive?.id === id;
          return (
            <div className="flex items-center justify-start gap-2">
              <Switch
                checked={row.original.active}
                disabled={busy}
                aria-label={t("admin.shipping.rates.table.active")}
                onCheckedChange={(checked) =>
                  void handleActiveChange(id, checked)
                }
              />
              <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center">
                {busy ? (
                  <Loader2
                    className="h-4 w-4 animate-spin text-muted-foreground"
                    aria-hidden
                  />
                ) : null}
              </span>
            </div>
          );
        },
      },
      {
        id: "updatedAt",
        accessorKey: "updatedAt",
        meta: { cellClassName: UPDATED_AT_COLUMN_CLASS },
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          updatedAtSortMs(rowA.original) - updatedAtSortMs(rowB.original),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.shipping.rates.table.updatedAt")}
            ariaLabelIdle={t("admin.shipping.rates.table.updatedAtSortIdle")}
            ariaLabelAsc={t("admin.shipping.rates.table.updatedAtSortAsc")}
            ariaLabelDesc={t("admin.shipping.rates.table.updatedAtSortDesc")}
          />
        ),
        cell: ({ row }) => {
          const raw = row.original.updatedAt;
          const relative = formatRelativeLastAccess(raw, locale);
          const absolute = formatDateDdMmYyyyHhMm(raw, locale);
          if (relative == null) {
            return (
              <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
                {absolute}
              </span>
            );
          }
          return (
            <TooltipProvider delayDuration={120}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help whitespace-nowrap text-sm tabular-nums text-muted-foreground">
                    {relative}
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="start"
                  className="rounded-xl border-border/60 bg-popover px-3 py-2 text-[11px] text-popover-foreground shadow-xl"
                >
                  <span className="block font-medium">
                    {t("admin.shipping.rates.table.updatedTooltip")}
                  </span>
                  <span className="mt-0.5 block text-muted-foreground">
                    {absolute}
                  </span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        },
      },
      {
        id: "actions",
        header: () => (
          <span className="sr-only">
            {t("admin.shipping.rates.table.actions")}
          </span>
        ),
        meta: { align: "right" },
        cell: ({ row }) => (
          <ShippingRateRowActions
            rate={row.original}
            onEdit={() => openEdit(row.original)}
          />
        ),
      },
    ],
    [
      handleActiveChange,
      locale,
      openEdit,
      orderByRateId,
      pendingActive,
      t,
    ],
  );

  const renderMobileRow = useCallback(
    (row: Row<ShippingRate>) => {
      const r = row.original;
      const busy = pendingActive?.id === r.id;
      return (
        <li key={row.id}>
          <ShippingRateProfileCard
            order={orderByRateId.get(r.id) ?? 0}
            minAmount={r.minAmount}
            maxAmount={r.maxAmount}
            cost={r.cost}
            active={r.active}
            updatedAt={r.updatedAt}
            className={cn(!r.active && "opacity-60")}
            activeUpdating={busy}
            onActiveChange={(checked) => void handleActiveChange(r.id, checked)}
            actions={
              <ShippingRateRowActions
                rate={r}
                onEdit={() => openEdit(r)}
              />
            }
          />
        </li>
      );
    },
    [
      handleActiveChange,
      openEdit,
      orderByRateId,
      pendingActive,
    ],
  );

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={rates}
        isLoading={isLoading}
        enableSorting
        defaultSorting={[{ id: "minAmount", desc: false }]}
        searchPlaceholder={t("admin.shipping.rates.searchPlaceholder")}
        emptyTitle={t("admin.shipping.rates.emptyTitle")}
        emptyDescription={t("admin.shipping.rates.emptyDescription")}
        getRowClassName={(row) => cn(!row.active && "opacity-60")}
        renderMobileRow={renderMobileRow}
        toolbarActions={
          <Button
            type="button"
            className={cn(
              "h-9 w-full shrink-0 md:w-auto",
              NEW_BUTTON_MIN_W_CLASS,
            )}
            onClick={openCreate}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            {t("admin.shipping.rates.buttonNew")}
          </Button>
        }
      />
      <ShippingRateFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rate={editing}
      />
    </div>
  );
}
