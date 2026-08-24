import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

// -------------------------------------------------------
// Types
// -------------------------------------------------------

export type InventoryProcessingStatus =
  | "success"
  | "already_processed"
  | "conflict"
  | "error";

export type InventoryConflictItem = {
  product_id: string;
  requested: number;
  available: number;
};

export type ProcessInventoryResult =
  | { status: "success"; orderId: string }
  | { status: "already_processed"; orderId: string }
  | { status: "conflict"; orderId: string; conflicts: InventoryConflictItem[] }
  | { status: "error"; orderId: string; error: string };

type InventoryRpcResponse = {
  status: string;
  order_id: string;
  conflicts?: InventoryConflictItem[];
};

// -------------------------------------------------------
// Core function
// -------------------------------------------------------

/**
 * Atomically processes inventory deduction for a confirmed Stripe order.
 *
 * Delegates all critical logic to the `process_order_inventory` PostgreSQL
 * function which:
 *   - Locks product rows (FOR UPDATE, sorted by product_id) to prevent overselling
 *   - Verifies stock for every item before touching anything
 *   - Deducts stock and records inventory_movements in one transaction
 *   - Returns 'already_processed' if movements already exist (idempotent)
 *   - Returns 'conflict' if any product lacks sufficient stock
 *
 * Should only be called after `session.payment_status === 'paid'` is confirmed
 * by the Stripe webhook. Never call from client-side code or /cart/success.
 */
export async function processOrderInventory(
  orderId: string,
  supabase?: ReturnType<typeof createSupabaseAdminClient>,
): Promise<ProcessInventoryResult> {
  const db = supabase ?? createSupabaseAdminClient();

  console.info("[INVENTORY]", { orderId, status: "processing" });

  const { data, error } = await db.rpc("process_order_inventory", {
    p_order_id: orderId,
  });

  if (error) {
    console.error("[INVENTORY]", {
      orderId,
      status: "error",
      error: error.message,
      code: error.code,
    });
    return { status: "error", orderId, error: error.message };
  }

  const result = data as InventoryRpcResponse | null;

  if (!result) {
    console.error("[INVENTORY]", {
      orderId,
      status: "error",
      error: "RPC returned null",
    });
    return { status: "error", orderId, error: "RPC returned null" };
  }

  if (result.status === "conflict") {
    const conflicts = result.conflicts ?? [];
    console.warn("[INVENTORY]", {
      orderId,
      status: "conflict",
      conflicts: conflicts.map((c) => ({
        productId: c.product_id,
        requested: c.requested,
        available: c.available,
      })),
    });
    return { status: "conflict", orderId, conflicts };
  }

  if (result.status === "already_processed") {
    console.info("[INVENTORY]", { orderId, status: "already_processed" });
    return { status: "already_processed", orderId };
  }

  if (result.status === "success") {
    console.info("[INVENTORY]", { orderId, status: "success" });
    return { status: "success", orderId };
  }

  const unexpected = `Unexpected RPC status: ${result.status}`;
  console.error("[INVENTORY]", { orderId, status: "error", error: unexpected });
  return { status: "error", orderId, error: unexpected };
}
