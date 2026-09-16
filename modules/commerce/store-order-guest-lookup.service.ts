import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { mapStoreOrderShippingAddressRow } from "@/lib/order-shipping-recipient";
import type { OrderShippingRecipient } from "@/lib/order-shipping-recipient";
import type { StoreOrderStatusHistoryRow } from "@/modules/commerce/store-order-status-history";
import type { SiteOrderStatus } from "@/modules/commerce/store-orders.service";

export type GuestOrderLookupResult = {
  id: string;
  orderNumber: string;
  status: SiteOrderStatus;
  createdAt: string;
  amountSubtotal: number;
  amountTax: number;
  amountShipping: number;
  amountDiscount: number;
  total: number;
  shippingAddress: OrderShippingRecipient | null;
  statusHistory: StoreOrderStatusHistoryRow[];
  items: Array<{
    productName: string;
    productSku: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeOrderNumber(orderNumber: string): string {
  return orderNumber.trim().toUpperCase();
}

/**
 * Lookup público para invitados: nº de pedido + email del cliente.
 * Usa service role (RLS no permite lectura anónima).
 */
export async function lookupStoreOrderByNumberAndEmail(
  orderNumberRaw: string,
  emailRaw: string,
): Promise<GuestOrderLookupResult | null> {
  const orderNumber = normalizeOrderNumber(orderNumberRaw);
  const email = normalizeEmail(emailRaw);
  if (!orderNumber || !email) return null;

  const supabase = createSupabaseAdminClient();
  const { data: order, error } = await supabase
    .from("store_orders")
    .select(
      "id, order_number, status, total_amount, amount_subtotal, amount_tax, amount_shipping, amount_discount, created_at, customer_email, store_order_items ( product_name, product_sku, quantity, unit_price, total_price ), store_order_shipping_addresses ( recipient_name, recipient_phone, recipient_email, address_line, address_line_2, city, state, postal_code, country )",
    )
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error) {
    console.error("[store-orders] guest lookup", error.message);
    return null;
  }
  if (!order) return null;

  const orderEmail = normalizeEmail(String(order.customer_email ?? ""));
  if (!orderEmail || orderEmail !== email) return null;

  const { data: historyRows, error: historyError } = await supabase
    .from("store_order_status_history")
    .select("id, status, previous_status, note, created_at")
    .eq("store_order_id", order.id)
    .order("created_at", { ascending: true });

  if (historyError) {
    console.error("[store-orders] guest lookup history", historyError.message);
  }

  const shippingRaw = order.store_order_shipping_addresses;
  const shippingRow = Array.isArray(shippingRaw) ? shippingRaw[0] : shippingRaw;

  return {
    id: String(order.id),
    orderNumber:
      String(order.order_number ?? "").trim() || String(order.id).slice(0, 8),
    status: order.status as SiteOrderStatus,
    createdAt: String(order.created_at),
    amountSubtotal: Number(order.amount_subtotal) || 0,
    amountTax: Number(order.amount_tax) || 0,
    amountShipping: Number(order.amount_shipping) || 0,
    amountDiscount: Number(order.amount_discount) || 0,
    total: Number(order.total_amount) || 0,
    shippingAddress: mapStoreOrderShippingAddressRow(shippingRow),
    statusHistory: (historyRows ?? []).map((row) => ({
      id: String(row.id),
      status: row.status as SiteOrderStatus,
      previousStatus: row.previous_status
        ? (row.previous_status as SiteOrderStatus)
        : null,
      changedByName: null,
      note: row.note != null ? String(row.note) : null,
      createdAt: String(row.created_at),
    })),
    items:
      (
        order.store_order_items as
          | Array<{
              product_name: string;
              product_sku: string | null;
              quantity: number;
              unit_price: string | number;
              total_price: string | number;
            }>
          | null
          | undefined
      )?.map((item) => ({
        productName: String(item.product_name),
        productSku: item.product_sku?.trim() || null,
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unit_price) || 0,
        totalPrice: Number(item.total_price) || 0,
      })) ?? [],
  };
}
