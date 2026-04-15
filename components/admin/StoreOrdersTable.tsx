"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ColumnDef } from "@tanstack/react-table";
import Select, { type SingleValue } from "react-select";
import { formatUsd } from "@/components/store/store-cart-format";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { appToolbarSelectStyles } from "@/components/ui/react-select-app-styles";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminTableEmptyEmDash } from "@/components/admin/admin-table-empty";
import {
  AdminStoreOrderItemRow,
  AdminStoreOrderRow,
} from "@/modules/commerce/store-orders.admin.service";
import { SiteOrderStatus } from "@/modules/commerce/store-orders.service";
import { Loader2, Edit3, X } from "lucide-react";

const STATUS_LABELS: Record<SiteOrderStatus, string> = {
  confirmada: "Confirmada",
  procesando: "Procesando",
  enviando: "Enviando",
  completada: "Completada",
};

const STATUS_OPTIONS: SiteOrderStatus[] = [
  "confirmada",
  "procesando",
  "enviando",
  "completada",
];

const STATUS_SELECT_OPTIONS = STATUS_OPTIONS.map((value) => ({
  value,
  label: STATUS_LABELS[value],
}));

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Todos los estados" },
  ...STATUS_SELECT_OPTIONS,
] as const;

type StatusFilterValue = (typeof STATUS_FILTER_OPTIONS)[number]["value"];

const STATUS_BADGE_CLASSES: Record<SiteOrderStatus, string> = {
  confirmada: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  procesando: "bg-amber-50 text-amber-600 border border-amber-100",
  enviando: "bg-sky-50 text-sky-600 border border-sky-100",
  completada: "bg-violet-50 text-violet-600 border border-violet-100",
};

function orderStatusBadgeClass(status: SiteOrderStatus) {
  return `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${STATUS_BADGE_CLASSES[status]}`;
}

function formatOrderDate(raw?: string | null) {
  if (!raw) return <AdminTableEmptyEmDash />;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return <AdminTableEmptyEmDash />;
  return parsed.toLocaleString();
}

export function StoreOrdersTable({ orders }: { orders: AdminStoreOrderRow[] }) {
  const [rows, setRows] = useState<AdminStoreOrderRow[]>(orders);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [editingStatusOrderId, setEditingStatusOrderId] = useState<string | null>(null);
  const [itemsDialogOpen, setItemsDialogOpen] = useState(false);
  const [itemsModalOrderId, setItemsModalOrderId] = useState<string | null>(null);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [orderItems, setOrderItems] = useState<AdminStoreOrderItemRow[]>([]);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>(
    STATUS_FILTER_OPTIONS[0].value,
  );

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
          throw new Error(payload?.error ?? "No se pudo actualizar el estado.");
        }
        setRows((prev) =>
          prev.map((row) =>
            row.id === orderId ? { ...row, status: nextStatus } : row,
          ),
        );
        toast.success("Estado actualizado.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "No se pudo cambiar el estado.",
        );
      } finally {
        setUpdating((prev) => ({ ...prev, [orderId]: false }));
        setEditingStatusOrderId((current) => (current === orderId ? null : current));
      }
    },
    [],
  );

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
        throw new Error(payload?.error ?? "No se pudieron cargar los items.");
      }
      if (Array.isArray(payload?.items)) {
        setOrderItems(payload.items);
      } else {
        setOrderItems([]);
      }
    } catch (error) {
      setOrderItems([]);
      setItemsError(
        error instanceof Error ? error.message : "No se pudieron cargar los items.",
      );
    } finally {
      setItemsLoading(false);
    }
  }, []);

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

  const columns = useMemo<ColumnDef<AdminStoreOrderRow>[]>(
    () => [
      {
        accessorKey: "customer_name",
        header: "Cliente",
        cell: ({ row }) => {
          const value = row.original.customer_name?.trim();
          return value || <AdminTableEmptyEmDash />;
        },
      },
      {
        accessorKey: "customer_email",
        header: "Email",
        cell: ({ row }) => {
          const value = row.original.customer_email?.trim();
          return value || <AdminTableEmptyEmDash />;
        },
      },
      {
        accessorKey: "stripe_amount_total",
        header: "Total Stripe",
        cell: ({ row }) => formatUsd(Number(row.original.stripe_amount_total ?? "0")),
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
          const rowId = row.original.id;
          const isEditing = editingStatusOrderId === rowId;
          const selectedOption = STATUS_SELECT_OPTIONS.find(
            (option) => option.value === row.original.status,
          );
          const isUpdating = Boolean(updating[rowId]);
          return (
            <div className="flex items-center gap-2">
              {isUpdating ? (
                <Loader2 className="h-4 w-4 text-muted-foreground" />
              ) : isEditing ? (
                <div className="flex items-center gap-2">
                  <Select
                    instanceId={`order-status-${rowId}`}
                    menuPlacement="auto"
                    menuPosition="fixed"
                    menuPortalTarget={
                      typeof window !== "undefined" ? document.body : undefined
                    }
                    options={STATUS_SELECT_OPTIONS}
                    styles={appToolbarSelectStyles}
                    value={selectedOption}
                    isSearchable={false}
                    isClearable={false}
                    isDisabled={Boolean(updating[rowId])}
                    onChange={(option: SingleValue<typeof STATUS_SELECT_OPTIONS[number]>) => {
                      if (!option) return;
                      const nextStatus = option.value;
                      setEditingStatusOrderId(null);
                      void (async () => {
                        await handleStatusChange(rowId, nextStatus);
                      })();
                    }}
                  />
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition hover:border-foreground hover:text-foreground"
                    aria-label="Cerrar selector"
                    onClick={() => setEditingStatusOrderId(null)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <span className={orderStatusBadgeClass(row.original.status)}>
                    {STATUS_LABELS[row.original.status]}
                  </span>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition hover:border-foreground hover:text-foreground"
                    aria-label="Cambiar estado"
                    onClick={() =>
                      setEditingStatusOrderId((current) =>
                        current === rowId ? null : rowId,
                      )
                    }
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          );
        },
      },
      {
        id: "items",
        header: "Items",
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => void handleShowItems(row.original.id)}
          >
            Ver items
          </Button>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Creado",
        meta: { align: "right" },
        cell: ({ row }) => formatOrderDate(row.original.created_at),
      },
    ],
    [handleShowItems, handleStatusChange, updating, editingStatusOrderId],
  );

  const toolbarFilters = useMemo(
    () => (
      <div className="min-w-[220px]">
        <Select
          instanceId="admin-orders-status-filter"
          options={STATUS_FILTER_OPTIONS}
          styles={appToolbarSelectStyles}
          value={STATUS_FILTER_OPTIONS.find((option) => option.value === statusFilter)}
          isSearchable={false}
          isClearable={false}
          onChange={(option) => {
            if (!option) return;
            setStatusFilter(option.value);
          }}
        />
      </div>
    ),
    [statusFilter],
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredRows}
        enableSorting
        searchPlaceholder="Buscar por cliente, email o estado…"
        tableHeadCellClassName="!font-semibold uppercase tracking-wide text-muted-foreground"
        tableBodyCellClassName="py-4 whitespace-nowrap"
        paginationClassName="border-border/70"
        paginationButtonVariant="ghost"
        getRowClassName={() =>
          "hover:bg-muted/50 transition-colors duration-150"
        }
        toolbarFilters={toolbarFilters}
      />
      <Dialog
        open={itemsDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeItemsModal();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Items del pedido</DialogTitle>
            {itemsModalOrderId ? (
              <DialogDescription>
                Pedido {itemsModalOrderId.slice(0, 8)}…
              </DialogDescription>
            ) : null}
          </DialogHeader>
          <div className="mt-4 space-y-3">
            {itemsLoading ? (
              <p className="text-sm text-muted-foreground">Cargando…</p>
            ) : itemsError ? (
              <p className="text-sm text-destructive">{itemsError}</p>
            ) : orderItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No se encontraron items para este pedido.
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border bg-background">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left">Producto</th>
                        <th className="px-3 py-2 text-right">Cantidad</th>
                        <th className="px-3 py-2 text-right">Precio unidad</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item, index) => (
                        <tr
                          key={`${item.product_name}-${index}`}
                          className="border-t border-border/70"
                        >
                          <td className="px-3 py-2 font-medium">
                            {item.product_name}
                          </td>
                          <td className="px-3 py-2 text-right">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">
                            {formatUsd(Number(item.unit_price ?? "0"))}
                          </td>
                          <td className="px-3 py-2 text-right">
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
          <DialogFooter>
            <Button variant="outline" onClick={closeItemsModal}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
