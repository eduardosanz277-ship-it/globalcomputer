import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { maybeSendStoreOrderConfirmationEmail } from "@/modules/commerce/store-order-confirmation-email.service";
import { maybeSendStoreOrderStatusEmail } from "@/modules/commerce/store-order-status-email.service";
import { recordStoreOrderStatusChange } from "@/modules/commerce/store-order-status-history";
import type { StoreOrderStatusHistoryRow } from "@/modules/commerce/store-order-status-history";
import { processOrderInventory } from "@/modules/commerce/inventory.service";
import { SiteOrderStatus } from "./store-orders.service";

export type { StoreOrderStatusHistoryRow };

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
  changedBy?: string | null,
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

  const previousStatus = current.status as SiteOrderStatus;

  if (
    current.shipping_method === "automatic" &&
    (status === "pending" || status === "cancelled")
  ) {
    throw new Error("STATUS_NOT_ALLOWED");
  }

  // Pedidos manuales pendientes: primero confirmar (con envío) antes de avanzar.
  if (
    current.shipping_method === "manual" &&
    current.status === "pending" &&
    status !== "pending" &&
    status !== "confirmed" &&
    status !== "cancelled"
  ) {
    throw new Error("MANUAL_CONFIRM_REQUIRED");
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
    if (previousStatus !== status) {
      await recordStoreOrderStatusChange({
        orderId,
        status,
        previousStatus,
        changedBy: changedBy ?? null,
      });
    }

    // Process inventory atomically after confirming the manual order.
    // For manual orders the admin's confirmation is the equivalent of
    // Stripe's payment_status = 'paid' — it is the authoritative signal that
    // the order will be fulfilled.
    const adminSupabase = createSupabaseAdminClient();
    const inventoryResult = await processOrderInventory(orderId, adminSupabase);

    if (inventoryResult.status === "conflict") {
      // Admin confirmed the order but at least one item has insufficient stock.
      // The order status is already 'confirmed'; mark the conflict so the admin
      // can review and resolve it. Do NOT send the confirmation email.
      console.warn(
        "[INVENTORY] conflict en confirmación manual de pedido - requiere atención",
        { orderId, conflicts: inventoryResult.conflicts },
      );
      return {
        status,
        amount_shipping: String(shipping),
        total_amount: String(totalAmount),
      };
    }

    if (inventoryResult.status === "error") {
      // Transient DB error. Unlike the Stripe webhook path, there is no
      // automatic retry mechanism here. Log the error and continue so the
      // admin at least gets feedback that the order was confirmed.
      // The inventory can be reprocessed manually via Supabase Studio or by
      // re-triggering this confirmation.
      console.error(
        "[INVENTORY] error al procesar inventario en confirmación manual",
        { orderId, error: inventoryResult.error },
      );
      // Fall through to send the email anyway (admin is aware of the context).
    }

    await maybeSendStoreOrderConfirmationEmail({
      orderId,
      supabase: adminSupabase,
    });

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
  if (previousStatus !== status) {
    await recordStoreOrderStatusChange({
      orderId,
      status,
      previousStatus,
      changedBy: changedBy ?? null,
    });
    await maybeSendStoreOrderStatusEmail({
      orderId,
      status,
      supabase: createSupabaseAdminClient(),
    });
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

export async function repoGetAdminStoreOrderShippingAddress(
  orderId: string,
): Promise<AdminStoreOrderShippingAddressRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("store_order_shipping_addresses")
    .select(
      "recipient_name, recipient_phone, recipient_email, address_line, address_line_2, city, state, postal_code, country",
    )
    .eq("store_order_id", orderId)
    .maybeSingle();
  if (error) {
    throw new Error(
      [error.message, error.code ? `(${error.code})` : ""].filter(Boolean).join(" "),
    );
  }
  if (!data) return null;
  return {
    recipient_name: String(data.recipient_name),
    recipient_phone: String(data.recipient_phone),
    recipient_email: data.recipient_email
      ? String(data.recipient_email)
      : null,
    address_line: String(data.address_line),
    address_line_2: data.address_line_2 ? String(data.address_line_2) : null,
    city: String(data.city),
    state: data.state ? String(data.state) : null,
    postal_code: String(data.postal_code),
    country: String(data.country ?? "US"),
  };
}

export async function repoListAdminStoreOrderStatusHistory(
  orderId: string,
): Promise<StoreOrderStatusHistoryRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("store_order_status_history")
    .select("id, status, previous_status, note, created_at, changed_by")
    .eq("store_order_id", orderId)
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error(
      [error.message, error.code ? `(${error.code})` : ""].filter(Boolean).join(" "),
    );
  }

  const rows = data ?? [];
  const changerIds = [
    ...new Set(
      rows
        .map((row) =>
          row.changed_by != null && String(row.changed_by).trim() !== ""
            ? String(row.changed_by)
            : null,
        )
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const nameById = new Map<string, string>();
  if (changerIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", changerIds);
    if (profilesError) {
      console.error(
        "[store-order-status-history] profiles",
        profilesError.message,
      );
    } else {
      for (const profile of profiles ?? []) {
        const name =
          profile.full_name != null && String(profile.full_name).trim() !== ""
            ? String(profile.full_name).trim()
            : null;
        if (name) nameById.set(String(profile.id), name);
      }
    }
  }

  return rows.map((row) => {
    const changedBy =
      row.changed_by != null ? String(row.changed_by) : null;
    return {
      id: String(row.id),
      status: row.status as SiteOrderStatus,
      previousStatus: row.previous_status
        ? (row.previous_status as SiteOrderStatus)
        : null,
      changedByName: changedBy ? (nameById.get(changedBy) ?? null) : null,
      note: row.note != null ? String(row.note) : null,
      createdAt: String(row.created_at),
    };
  });
}
