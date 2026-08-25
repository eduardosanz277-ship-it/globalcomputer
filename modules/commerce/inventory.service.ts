import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { sendAdminInventoryConflictEmail } from "@/lib/email/sendAdminInventoryConflictEmail";
import { getAppBaseUrl } from "@/lib/app-url";

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
  /** Populated before sending admin emails; not returned by the RPC. */
  product_name?: string;
  product_sku?: string;
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

export type ProcessOrderInventoryOptions = {
  /** When false, skips the admin conflict alert email (e.g. manual reprocess retries). */
  notifyAdminOnConflict?: boolean;
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
  options?: ProcessOrderInventoryOptions,
): Promise<ProcessInventoryResult> {
  const db = supabase ?? createSupabaseAdminClient();
  const notifyAdminOnConflict = options?.notifyAdminOnConflict ?? true;

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

    // Awaited inside try/catch so the email is guaranteed to be attempted
    // before the calling function returns (critical in serverless environments
    // where fire-and-forget callbacks are killed when the response is sent).
    if (notifyAdminOnConflict) {
      try {
        const { data: order, error: orderErr } = await db
          .from("store_orders")
          .select("order_number, customer_name, customer_email, total_amount, stripe_amount_total, shipping_method")
          .eq("id", orderId)
          .maybeSingle();

        if (orderErr) {
          console.error("[INVENTORY] no se pudo obtener el pedido para la alerta al admin", {
            orderId,
            error: orderErr.message,
          });
        } else if (!order) {
          console.error("[INVENTORY] pedido no encontrado al intentar enviar alerta al admin", { orderId });
        } else {
          const appUrl = getAppBaseUrl();
          const displayTotal =
            order.shipping_method === "manual"
              ? Number(order.total_amount ?? 0)
              : Number(order.stripe_amount_total ?? 0);
          const totalFormatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(displayTotal);

          // Enrich conflict items with product name + SKU for the email table.
          const productIds = conflicts.map((c) => c.product_id);
          const enrichedConflicts = [...conflicts];
          if (productIds.length > 0) {
            const { data: products } = await db
              .from("products")
              .select("id, name, sku")
              .in("id", productIds);
            if (products && products.length > 0) {
              const byId = new Map(products.map((p) => [String(p.id), p]));
              for (const item of enrichedConflicts) {
                const p = byId.get(item.product_id);
                if (p) {
                  item.product_name = p.name ? String(p.name) : undefined;
                  item.product_sku = p.sku ? String(p.sku) : undefined;
                }
              }
            }
          }

          const emailResult = await sendAdminInventoryConflictEmail({
            orderNumber: String(order.order_number ?? "").trim() || orderId.slice(0, 8),
            orderId,
            customerName: String(order.customer_name ?? ""),
            customerEmail: String(order.customer_email ?? ""),
            totalAmount: totalFormatted,
            conflicts: enrichedConflicts,
            adminOrdersUrl: `${appUrl}/admin/orders`,
          });

          if (!emailResult.sent) {
            console.warn("[INVENTORY] alerta al admin no enviada (ver logs de email)", { orderId });
          } else {
            console.info("[INVENTORY] alerta al admin enviada", { orderId });
          }
        }
      } catch (alertErr) {
        console.error("[INVENTORY] error al enviar alerta al admin", { orderId, error: alertErr });
      }
    }

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
