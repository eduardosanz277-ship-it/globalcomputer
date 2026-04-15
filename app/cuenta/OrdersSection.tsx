"use client";

import {
  type ReactNode,
  useMemo,
  useState,
} from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CuentaOrder } from "./types";
import { formatOrderCurrency, formatOrderDate, orderStatusStyles } from "./order-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  orders: CuentaOrder[];
  title?: string;
  description?: string;
};

function itemsCountLabel(order: CuentaOrder) {
  return `${order.items.length} ${order.items.length === 1 ? "artículo" : "artículos"}`;
}

export function OrdersSection({
  orders,
  title = "Pedidos recientes",
  description = "Consulta el estado y el importe de tus compras.",
}: Props) {
  const [detailOrder, setDetailOrder] = useState<CuentaOrder | null>(null);

  const columns = useMemo<ColumnDef<CuentaOrder>[]>(
    () => [
      {
        id: "pedido",
        header: "Pedido",
        cell: ({ row }) => (
          <div className="font-semibold text-foreground">{row.original.id.slice(0, 8)}</div>
        ),
      },
      {
        id: "items",
        header: "Items",
        cell: ({ row }) => (
          <div className="text-muted-foreground">{itemsCountLabel(row.original)}</div>
        ),
      },
      {
        id: "fecha",
        header: "Fecha",
        cell: ({ row }) => (
          <div className="text-muted-foreground">{formatOrderDate(row.original.createdAt)}</div>
        ),
      },
      {
        id: "estado",
        header: "Estado",
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${
              orderStatusStyles[row.original.status] ?? "bg-muted text-muted-foreground"
            }`}
          >
            {row.original.status}
          </span>
        ),
      },
      {
        id: "total",
        header: "Total",
        cell: ({ row }) => (
          <div className="font-semibold text-foreground">
            {formatOrderCurrency(row.original.total)}
          </div>
        ),
      },
      {
        id: "acciones",
        header: "Acción",
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDetailOrder(row.original)}
          >
            Ver detalles
          </Button>
        ),
      },
    ],
    [setDetailOrder],
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no tienes pedidos. Cuando hagas uno aparecerá aquí.
            </p>
          ) : (
            <DataTable
              columns={columns}
              data={orders}
              enableSorting
              searchPlaceholder="Buscar pedidos…"
              tableClassName="min-w-[640px]"
              tableBodyCellClassName="py-3"
              paginationClassName="border-border/70"
              paginationButtonVariant="ghost"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pedido {detailOrder?.id.slice(0, 8)}</DialogTitle>
            <DialogDescription>
              {detailOrder
                ? `${itemsCountLabel(detailOrder)} · ${formatOrderDate(
                    detailOrder.createdAt,
                  )}`
                : "Cargando detalles…"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            {detailOrder ? (
              <>
                <div className="grid gap-3 md:grid-cols-4">
                  <SummaryTile title="Subtotal">
                    {formatOrderCurrency(detailOrder.amountSubtotal)}
                  </SummaryTile>
                  <SummaryTile title="Impuestos">
                    {formatOrderCurrency(detailOrder.amountTax)}
                  </SummaryTile>
                  <SummaryTile title="Envío">
                    {formatOrderCurrency(detailOrder.amountShipping)}
                  </SummaryTile>
                  <SummaryTile title="Total">
                    {formatOrderCurrency(detailOrder.stripeAmountTotal)}
                  </SummaryTile>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/60 shadow-inner">
                  <div className="overflow-hidden rounded-xl border border-transparent">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 text-left">Producto</th>
                          <th className="px-3 py-2 text-right">Cantidad</th>
                          <th className="px-3 py-2 text-right">Precio unidad</th>
                          <th className="px-3 py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailOrder.items.map((item, index) => (
                          <tr key={`${item.productName}-${index}`} className="border-t border-border/50 bg-white/70">
                            <td className="px-3 py-2 font-medium">{item.productName}</td>
                            <td className="px-3 py-2 text-right">{item.quantity}</td>
                            <td className="px-3 py-2 text-right">
                              {formatOrderCurrency(item.unitPrice)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {formatOrderCurrency(item.totalPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-6 border-t border-border/70 bg-muted/20 px-4 py-3 text-sm font-semibold text-foreground">
                    <span>Items: {itemsCountLabel(detailOrder)}</span>
                    <span>Status: <strong className="capitalize">{detailOrder.status}</strong></span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Cargando detalles…</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOrder(null)}>
              Cerrar
            </Button>
          </DialogFooter>
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
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      <p className="text-[10px] font-medium text-muted-foreground">{title}</p>
      <p className="text-base font-semibold text-foreground">{children}</p>
    </div>
  );
}
