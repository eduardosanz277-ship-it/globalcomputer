import type { StoreOrderStatusHistoryRow } from "@/modules/commerce/store-order-status-history";
import type { SiteOrderStatus } from "@/modules/commerce/store-orders.service";

function syntheticEntry(input: {
  id: string;
  status: SiteOrderStatus;
  previousStatus: SiteOrderStatus | null;
  createdAt: string;
}): StoreOrderStatusHistoryRow {
  return {
    id: input.id,
    status: input.status,
    previousStatus: input.previousStatus,
    changedByName: null,
    note: "initial",
    createdAt: input.createdAt,
  };
}

/**
 * Pedido aún pendiente (cotización manual o conflicto): solo Pendiente.
 * En el resto se muestra el historial real, en orden, incluyendo Pendiente
 * si el pedido pasó por ese estado (reintento, reembolso, cambio de estado).
 * No se inventa Pendiente en pagos Stripe que empezaron en Confirmado.
 */
export function historyWithPendingStatus(
  entries: StoreOrderStatusHistoryRow[],
  input: { createdAt: string; currentStatus: SiteOrderStatus },
): StoreOrderStatusHistoryRow[] {
  if (input.currentStatus === "pending") {
    const pending =
      entries.find((entry) => entry.status === "pending" && !entry.previousStatus) ??
      entries.find((entry) => entry.status === "pending");
    if (pending) return [pending];
    return [
      syntheticEntry({
        id: `synthetic-pending-initial-${input.createdAt}`,
        status: "pending",
        previousStatus: null,
        createdAt: input.createdAt,
      }),
    ];
  }

  return [...entries];
}
