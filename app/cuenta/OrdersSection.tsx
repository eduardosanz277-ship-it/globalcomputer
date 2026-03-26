"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CuentaOrder } from "./types";

type Props = {
  orders: CuentaOrder[];
};

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-900",
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("es", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function OrdersSection({ orders }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mis pedidos recientes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no tienes pedidos. Cuando hagas uno aparecerá aquí.
          </p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-background/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold tracking-tight text-foreground">
                    Pedido {order.id.slice(0, 8)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.itemsCount} {order.itemsCount === 1 ? "artículo" : "artículos"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                      statusStyles[order.status] ?? "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {order.status}
                  </span>
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(order.total)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
