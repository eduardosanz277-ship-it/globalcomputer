import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { SiteOrderStatus } from "./store-orders.service";

export type AdminStoreOrderRow = {
  id: string;
  customer_name: string;
  customer_email: string;
  status: SiteOrderStatus;
  total_amount: string;
  amount_subtotal: string;
  amount_tax: string;
  amount_shipping: string;
  stripe_amount_total: string;
  stripe_payment_status: string | null;
  stripe_session_id: string | null;
  created_at: string;
};

export type AdminStoreOrderItemRow = {
  product_name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
};

export type StoreOrdersQueryOptions = {
  limit?: number;
  status?: SiteOrderStatus;
};

export async function repoListAdminStoreOrders({
  limit = 50,
  status,
}: StoreOrdersQueryOptions = {}): Promise<AdminStoreOrderRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("store_orders")
    .select(
      "id, customer_name, customer_email, status, total_amount, amount_subtotal, amount_tax, amount_shipping, stripe_amount_total, stripe_payment_status, stripe_session_id, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(
      [error.message, error.code ? `(${error.code})` : ""].filter(Boolean).join(" "),
    );
  }
  return (
    data?.map((row) => ({
      id: String(row.id),
      customer_name: String(row.customer_name),
      customer_email: String(row.customer_email),
      status: row.status as SiteOrderStatus,
      total_amount: String(row.total_amount),
      amount_subtotal: String(row.amount_subtotal),
      amount_tax: String(row.amount_tax),
      amount_shipping: String(row.amount_shipping),
      stripe_amount_total: String(row.stripe_amount_total),
      stripe_payment_status: row.stripe_payment_status ?? null,
      stripe_session_id: row.stripe_session_id ?? null,
      created_at: String(row.created_at),
    })) ?? []
  );
}

export async function repoUpdateStoreOrderStatus(
  orderId: string,
  status: SiteOrderStatus,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("store_orders")
    .update({ status })
    .eq("id", orderId);
  if (error) {
    throw new Error(
      [error.message, error.code ? `(${error.code})` : ""].filter(Boolean).join(" "),
    );
  }
}

export async function repoListAdminStoreOrderItems(
  orderId: string,
): Promise<AdminStoreOrderItemRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("store_order_items")
    .select("product_name, quantity, unit_price, total_price")
    .eq("store_order_id", orderId)
    .order("product_name", { ascending: true });
  if (error) {
    throw new Error(
      [error.message, error.code ? `(${error.code})` : ""].filter(Boolean).join(" "),
    );
  }
  return (
    data?.map((row) => ({
      product_name: String(row.product_name),
      quantity: Number(row.quantity ?? 0),
      unit_price: String(row.unit_price ?? "0"),
      total_price: String(row.total_price ?? "0"),
    })) ?? []
  );
}
