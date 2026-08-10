import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { SiteOrderStatus } from "./store-orders.service";

export type AdminStoreOrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: SiteOrderStatus;
  total_amount: string;
  amount_subtotal: string;
  amount_tax: string;
  amount_shipping: string;
  amount_discount: string;
  amount_shipping_base: string;
  amount_shipping_surcharge: string;
  shipping_method: "automatic" | "manual";
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

export type AdminStoreOrderShippingAddressRow = {
  recipient_name: string;
  recipient_phone: string;
  recipient_email: string | null;
  address_line: string;
  address_line_2: string | null;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
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
      "id, order_number, customer_name, customer_email, status, total_amount, amount_subtotal, amount_tax, amount_shipping, amount_discount, amount_shipping_base, amount_shipping_surcharge, shipping_method, stripe_amount_total, stripe_payment_status, stripe_session_id, created_at",
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
      order_number: String(row.order_number ?? "").trim() || String(row.id),
      customer_name: String(row.customer_name),
      customer_email: String(row.customer_email),
      status: row.status as SiteOrderStatus,
      total_amount: String(row.total_amount),
      amount_subtotal: String(row.amount_subtotal),
      amount_tax: String(row.amount_tax),
      amount_shipping: String(row.amount_shipping),
      amount_discount: String(row.amount_discount ?? 0),
      amount_shipping_base: String(row.amount_shipping_base ?? 0),
      amount_shipping_surcharge: String(row.amount_shipping_surcharge ?? 0),
      shipping_method:
        row.shipping_method === "manual" ? "manual" : "automatic",
      stripe_amount_total: String(row.stripe_amount_total),
      stripe_payment_status: row.stripe_payment_status ?? null,
      stripe_session_id: row.stripe_session_id ?? null,
      created_at: String(row.created_at),
    })) ?? []
  );
}

export type UpdateStoreOrderStatusResult = {
  status: SiteOrderStatus;
  amount_shipping: string;
  total_amount: string;
};

export async function repoUpdateStoreOrderStatus(
  orderId: string,
  status: SiteOrderStatus,
  amountShipping?: number,
): Promise<UpdateStoreOrderStatusResult> {
  const supabase = await createSupabaseServerClient();
  const { data: current, error: fetchError } = await supabase
    .from("store_orders")
    .select(
      "status, shipping_method, amount_subtotal, amount_discount, amount_shipping, total_amount",
    )
    .eq("id", orderId)
    .maybeSingle();
  if (fetchError) {
    throw new Error(
      [fetchError.message, fetchError.code ? `(${fetchError.code})` : ""]
        .filter(Boolean)
        .join(" "),
    );
  }
  if (!current) {
    throw new Error("ORDER_NOT_FOUND");
  }

  if (
    current.shipping_method === "automatic" &&
    (status === "pending" || status === "cancelled")
  ) {
    throw new Error("STATUS_NOT_ALLOWED");
  }

  const isManualPendingConfirm =
    current.status === "pending" &&
    current.shipping_method === "manual" &&
    status === "confirmed";

  if (isManualPendingConfirm) {
    if (
      typeof amountShipping !== "number" ||
      !Number.isFinite(amountShipping) ||
      amountShipping <= 0
    ) {
      throw new Error("SHIPPING_AMOUNT_REQUIRED");
    }
    const shipping = Number(amountShipping.toFixed(2));
    const subtotal = Number(current.amount_subtotal ?? 0);
    const discount = Number(current.amount_discount ?? 0);
    const totalAmount = Number((subtotal - discount + shipping).toFixed(2));
    const { error } = await supabase
      .from("store_orders")
      .update({
        status,
        amount_shipping: shipping,
        total_amount: totalAmount,
      })
      .eq("id", orderId);
    if (error) {
      throw new Error(
        [error.message, error.code ? `(${error.code})` : ""]
          .filter(Boolean)
          .join(" "),
      );
    }
    return {
      status,
      amount_shipping: String(shipping),
      total_amount: String(totalAmount),
    };
  }

  const { error } = await supabase
    .from("store_orders")
    .update({ status })
    .eq("id", orderId);
  if (error) {
    throw new Error(
      [error.message, error.code ? `(${error.code})` : ""].filter(Boolean).join(" "),
    );
  }
  return {
    status,
    amount_shipping: String(current.amount_shipping ?? 0),
    total_amount: String(current.total_amount ?? 0),
  };
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
