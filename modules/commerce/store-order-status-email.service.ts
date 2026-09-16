import { getAppBaseUrl } from "@/lib/app-url";
import {
  isUsableCustomerEmail,
  resolveOrderConfirmationEmailLocale,
  storeOrderAccountOrdersUrl,
} from "@/lib/email/order-confirmation-locale";
import { sendOrderStatusUpdateEmail } from "@/lib/email/sendOrderStatusUpdateEmail";
import { mapOrderEmailLineItems } from "@/lib/email/map-order-email-line-items.server";
import {
  shippingAddressFromStripeSession,
  shippingAddressLinesFromDb,
  shippingAddressLinesFromStripeSession,
} from "@/lib/order-shipping-lines";
import {
  orderStatusUpdateTemplateId,
  renderOrderStatusUpdateEmailSubject,
  type OrderStatusEmailKind,
} from "@/lib/email/templates/orderStatusUpdateTemplate";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { SiteOrderStatus } from "@/modules/commerce/store-orders.service";

type SupabaseAdmin = ReturnType<typeof createSupabaseAdminClient>;

const STATUS_EMAIL_KINDS: readonly OrderStatusEmailKind[] = [
  "processing",
  "shipping",
  "completed",
  "cancelled",
];

export function isOrderStatusEmailKind(
  status: SiteOrderStatus | string,
): status is OrderStatusEmailKind {
  return (STATUS_EMAIL_KINDS as readonly string[]).includes(status);
}

type StatusEmailOrderRow = {
  id: string;
  order_number: string | null;
  customer_name: string | null;
  customer_email: string | null;
  user_id?: string | null;
  status: string;
  locale: string | null;
  stripe_session_id?: string | null;
  created_at: string | null;
  total_amount: string | number | null;
  amount_subtotal: string | number | null;
  amount_tax: string | number | null;
  amount_shipping: string | number | null;
  amount_discount: string | number | null;
  store_order_items:
    | Array<{
        product_id: string;
        product_name: string | null;
        product_sku: string | null;
        quantity: number | null;
        unit_price: string | number | null;
        total_price: string | number | null;
      }>
    | null;
};

function parseMoney(value: string | number | null | undefined): number {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Number(n.toFixed(2));
}

function formatOrderDate(iso: string, locale: "es" | "en"): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(locale === "en" ? "en-US" : "es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function loadShippingAddressLines(
  supabase: SupabaseAdmin,
  orderId: string,
  stripeSessionId?: string | null,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("store_order_shipping_addresses")
    .select(
      "recipient_name, recipient_phone, address_line, address_line_2, city, state, postal_code, country",
    )
    .eq("store_order_id", orderId)
    .maybeSingle();
  if (error) {
    console.warn("[ORDER_STATUS_EMAIL] no se pudo leer dirección", error.message);
  }
  const fromDb = shippingAddressLinesFromDb(data);
  if (fromDb.length > 0) return fromDb;

  const sessionId = stripeSessionId?.trim();
  if (!sessionId) return [];

  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!stripeKey) return [];
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey, { apiVersion: "2026-03-25.dahlia" });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const fields = shippingAddressFromStripeSession(session);
    if (fields) {
      const { error: insertError } = await supabase
        .from("store_order_shipping_addresses")
        .insert({ store_order_id: orderId, ...fields });
      if (insertError && insertError.code !== "23505") {
        console.warn(
          "[ORDER_STATUS_EMAIL] no se pudo guardar dirección Stripe",
          insertError.message,
        );
      }
    }
    return shippingAddressLinesFromStripeSession(session);
  } catch (err) {
    console.warn("[ORDER_STATUS_EMAIL] no se pudo cargar dirección Stripe", {
      orderId,
      error: err instanceof Error ? err.message : "unknown",
    });
    return [];
  }
}

/**
 * Envía el correo transaccional al pasar a processing, shipping, completed o cancelled.
 * Usa el locale del pedido (`store_orders.locale`), igual que la confirmación.
 */
export async function maybeSendStoreOrderStatusEmail(input: {
  orderId: string;
  status: SiteOrderStatus;
  supabase?: SupabaseAdmin;
}): Promise<{ sent: boolean }> {
  if (!isOrderStatusEmailKind(input.status)) {
    return { sent: false };
  }

  const supabase = input.supabase ?? createSupabaseAdminClient();
  const appUrl = getAppBaseUrl();
  const status = input.status;

  const { data: order, error } = await supabase
    .from("store_orders")
    .select(
      "id, order_number, customer_name, customer_email, user_id, status, locale, stripe_session_id, created_at, total_amount, amount_subtotal, amount_tax, amount_shipping, amount_discount, store_order_items ( product_id, product_name, product_sku, quantity, unit_price, total_price )",
    )
    .eq("id", input.orderId)
    .maybeSingle();

  if (error || !order) {
    console.error("[ORDER_STATUS_EMAIL] no se pudo cargar pedido", {
      orderId: input.orderId,
      status,
      error,
    });
    return { sent: false };
  }

  const row = order as StatusEmailOrderRow;
  const locale = resolveOrderConfirmationEmailLocale(row.locale);
  const template = orderStatusUpdateTemplateId(locale, status);
  const email = String(row.customer_email ?? "").trim().toLowerCase();

  if (!isUsableCustomerEmail(email)) {
    console.warn("[ORDER_STATUS_EMAIL]", {
      orderId: input.orderId,
      locale,
      template,
      orderStatus: status,
      result: "skipped_invalid_email",
    });
    return { sent: false };
  }

  const itemsRaw = row.store_order_items ?? [];
  const items = await mapOrderEmailLineItems(
    supabase,
    Array.isArray(itemsRaw) ? itemsRaw : [],
    { appUrl, fallbackProductName: "Producto" },
  );

  if (items.length === 0) {
    console.warn("[ORDER_STATUS_EMAIL]", {
      orderId: input.orderId,
      locale,
      template,
      orderStatus: status,
      result: "skipped_no_items",
    });
    return { sent: false };
  }

  const shippingAddressLines = await loadShippingAddressLines(
    supabase,
    input.orderId,
    row.stripe_session_id,
  );

  const orderNumber =
    String(row.order_number ?? "").trim() || String(row.id).slice(0, 8);
  const subject = renderOrderStatusUpdateEmailSubject({
    locale,
    status,
    orderNumber,
  });

  console.info("[ORDER_STATUS_EMAIL]", {
    orderId: input.orderId,
    locale,
    orderLocale: row.locale ?? null,
    template,
    subject,
    orderStatus: status,
    result: "sending",
  });

  try {
    const result = await sendOrderStatusUpdateEmail(
      email,
      {
        locale,
        status,
        customerName: String(row.customer_name ?? "").trim(),
        orderNumber,
        orderDate: formatOrderDate(String(row.created_at ?? ""), locale),
        items,
        amountSubtotal: parseMoney(row.amount_subtotal),
        amountDiscount: parseMoney(row.amount_discount),
        amountTax: parseMoney(row.amount_tax),
        amountShipping: parseMoney(row.amount_shipping),
        totalAmount: parseMoney(row.total_amount),
        shippingAddressLines,
        orderLookupUrl: `${appUrl}/order-lookup`,
        profileOrdersUrl: storeOrderAccountOrdersUrl(appUrl, row.user_id),
      },
      {
        idempotencyKey: `order-status-${status}-${input.orderId}`,
      },
    );

    console.info("[ORDER_STATUS_EMAIL]", {
      orderId: input.orderId,
      locale,
      template,
      subject,
      orderStatus: status,
      result: result.sent ? "sent" : "failed",
    });

    return result;
  } catch (err) {
    console.error("[ORDER_STATUS_EMAIL]", {
      orderId: input.orderId,
      locale,
      template,
      subject,
      orderStatus: status,
      result: "failed",
      error: err instanceof Error ? err.message : "unknown",
    });
    return { sent: false };
  }
}
