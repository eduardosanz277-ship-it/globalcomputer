import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { SiteOrderStatus } from "@/modules/commerce/store-orders.service";

export type StoreOrderStatusHistoryRow = {
  id: string;
  status: SiteOrderStatus;
  previousStatus: SiteOrderStatus | null;
  changedByName: string | null;
  note: string | null;
  createdAt: string;
};

type RecordStatusChangeInput = {
  orderId: string;
  status: SiteOrderStatus;
  previousStatus?: SiteOrderStatus | null;
  changedBy?: string | null;
  note?: string | null;
  /** Cliente admin ya abierto (p. ej. webhook); si no, se crea uno. */
  supabase?: ReturnType<typeof createSupabaseAdminClient>;
};

/**
 * Registra un cambio de estado. No lanza si falla el insert (log); el pedido
 * principal no debe abortarse por el historial.
 */
export async function recordStoreOrderStatusChange(
  input: RecordStatusChangeInput,
): Promise<void> {
  const supabase = input.supabase ?? createSupabaseAdminClient();
  const { error } = await supabase.from("store_order_status_history").insert({
    store_order_id: input.orderId,
    status: input.status,
    previous_status: input.previousStatus ?? null,
    changed_by: input.changedBy ?? null,
    note: input.note?.trim() || null,
  });
  if (error) {
    console.error("[store-order-status-history] insert", error.message);
  }
}
