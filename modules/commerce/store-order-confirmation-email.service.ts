import type Stripe from "stripe";
import { getAppBaseUrl } from "@/lib/app-url";
import {
  isUsableCustomerEmail,
  orderConfirmationTemplateId,
  resolveOrderConfirmationEmailLocale,
  storeOrderAccountOrdersUrl,
  stripeSessionCustomerEmail,
} from "@/lib/email/order-confirmation-locale";
import { sendOrderConfirmationEmail } from "@/lib/email/sendOrderConfirmationEmail";
import {
  shippingAddressLinesFromDb,
  shippingAddressLinesFromStripeSession,
} from "@/lib/order-shipping-lines";
import {
  renderOrderConfirmationEmailSubject,
  type OrderConfirmationLineItem,
} from "@/lib/email/templates/orderConfirmationTemplate";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

type SupabaseAdmin = ReturnType<typeof createSupabaseAdminClient>;

type ConfirmationEmailOrderRow = {
  id: string;
  order_number: string | null;
  customer_name: string | null;
  customer_email: string | null;
  user_id?: string | null;
  status: string;
  locale: string | null;
  confirmation_email_sent_at?: string | null;
  confirmation_email_locale?: string | null;
  stripe_session_id: string | null;
  created_at: string | null;
  total_amount: string | number | null;
  amount_subtotal: string | number | null;
  amount_tax: string | number | null;
  amount_shipping: string | number | null;
  amount_discount: string | number | null;
  store_order_items:
    | Array<{
        product_name: string | null;
        quantity: number | null;
        unit_price: string | number | null;
        total_price: string | number | null;
      }>
    | null;
  store_order_shipping_addresses:
    | Array<{
        recipient_name?: string | null;
        recipient_phone?: string | null;
        address_line?: string | null;
        address_line_2?: string | null;
        city?: string | null;
        state?: string | null;
        postal_code?: string | null;
        country?: string | null;
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

async function releaseConfirmationEmailClaim(
  supabase: SupabaseAdmin,
  orderId: string,
): Promise<void> {
  const withLocale = await supabase
    .from("store_orders")
    .update({
      confirmation_email_sent_at: null,
      confirmation_email_locale: null,
    })
    .eq("id", orderId);
  if (withLocale.error) {
    const withoutLocale = await supabase
      .from("store_orders")
      .update({ confirmation_email_sent_at: null })
      .eq("id", orderId);
    if (withoutLocale.error) {
      console.warn(
        "[email] confirmación pedido: no se pudo liberar claim",
        withoutLocale.error,
      );
    }
  }
}

function isNoRowsReturned(error: { code?: string } | null): boolean {
  return error?.code === "PGRST116";
}

async function claimConfirmationEmailSend(
  supabase: SupabaseAdmin,
  orderId: string,
  locale: "es" | "en",
): Promise<boolean> {
  const rpc = await supabase.rpc("claim_store_order_confirmation_email", {
    p_order_id: orderId,
    p_locale: locale,
  });
  if (!rpc.error) {
    return rpc.data === true;
  }

  console.warn(
    "[email] confirmación pedido: RPC claim no disponible, fallback",
    rpc.error.message,
  );

  const claimedAt = new Date().toISOString();
  const claimed = await supabase
    .from("store_orders")
    .update({
      confirmation_email_sent_at: claimedAt,
      confirmation_email_locale: locale,
    })
    .eq("id", orderId)
    .is("confirmation_email_sent_at", null)
    .select("id")
    .maybeSingle();

  if (isNoRowsReturned(claimed.error)) {
    return false;
  }
  if (!claimed.error) {
    return Boolean(claimed.data?.id);
  }

  const fallback = await supabase
    .from("store_orders")
    .update({
      confirmation_email_sent_at: claimedAt,
    })
    .eq("id", orderId)
    .is("confirmation_email_sent_at", null)
    .select("id")
    .maybeSingle();

  if (isNoRowsReturned(fallback.error) || fallback.error) {
    if (fallback.error && !isNoRowsReturned(fallback.error)) {
      console.warn(
        "[email] confirmación pedido: no se pudo marcar envío",
        fallback.error.message,
      );
    }
    return false;
  }

  return Boolean(fallback.data?.id);
}

/**
 * Envía confirmación de compra cuando el pago está confirmado.
 * Un solo correo por pedido (claim atómico + Idempotency-Key).
 * Acepta `confirmed` (pago Stripe / confirmación admin) y `processing`.
 */
export async function maybeSendStoreOrderConfirmationEmail(input: {
  orderId: string;
  locale?: "es" | "en" | string | null;
  session?: Stripe.Checkout.Session;
  supabase?: SupabaseAdmin;
}): Promise<{ sent: boolean }> {
  const supabase = input.supabase ?? createSupabaseAdminClient();
  const appUrl = getAppBaseUrl();

  const orderSelectWithEmail =
    "id, order_number, customer_name, customer_email, user_id, status, locale, confirmation_email_sent_at, confirmation_email_locale, stripe_session_id, created_at, total_amount, amount_subtotal, amount_tax, amount_shipping, amount_discount, store_order_items ( product_name, quantity, unit_price, total_price ), store_order_shipping_addresses ( recipient_name, recipient_phone, address_line, address_line_2, city, state, postal_code, country )";
  const orderSelectBase =
    "id, order_number, customer_name, customer_email, user_id, status, locale, stripe_session_id, created_at, total_amount, amount_subtotal, amount_tax, amount_shipping, amount_discount, store_order_items ( product_name, quantity, unit_price, total_price ), store_order_shipping_addresses ( recipient_name, recipient_phone, address_line, address_line_2, city, state, postal_code, country )";

  let order: ConfirmationEmailOrderRow | null = null;
  let error: { message?: string; code?: string } | null = null;

  const withEmailCols = await supabase
    .from("store_orders")
    .select(orderSelectWithEmail)
    .eq("id", input.orderId)
    .maybeSingle();

  order = withEmailCols.data;
  error = withEmailCols.error;

  if (error) {
    const fallback = await supabase
      .from("store_orders")
      .select(orderSelectBase)
      .eq("id", input.orderId)
      .maybeSingle();
    order = fallback.data;
    error = fallback.error;
  }

  if (error || !order) {
    console.error("[email] confirmación pedido: no se pudo cargar pedido", error);
    return { sent: false };
  }

  if (order.status !== "confirmed" && order.status !== "processing") {
    return { sent: false };
  }

  const locale = resolveOrderConfirmationEmailLocale(order.locale);
  const template = orderConfirmationTemplateId(locale);

  let stripeSession = input.session;
  const needsStripeSession =
    Boolean(order.stripe_session_id?.trim()) &&
    (!stripeSession ||
      (!isUsableCustomerEmail(order.customer_email) &&
        !stripeSessionCustomerEmail(stripeSession)));
  if (needsStripeSession && order.stripe_session_id?.trim()) {
    try {
      const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
      if (stripeKey) {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(stripeKey, { apiVersion: "2026-03-25.dahlia" });
        stripeSession = await stripe.checkout.sessions.retrieve(
          order.stripe_session_id.trim(),
        );
      }
    } catch (err) {
      console.warn("[ORDER_CONFIRMATION_EMAIL] no se pudo cargar sesión Stripe", {
        orderId: input.orderId,
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  const alreadySentAt = order.confirmation_email_sent_at;
  if (alreadySentAt) {
    console.info("[ORDER_CONFIRMATION_EMAIL]", {
      orderId: input.orderId,
      locale,
      orderLocale: order.locale ?? null,
      template,
      status: "skipped_already_sent",
    });
    return { sent: false };
  }

  const stripeEmail = stripeSessionCustomerEmail(stripeSession);
  let email = stripeEmail ?? String(order.customer_email ?? "").trim().toLowerCase();
  if (stripeEmail && stripeEmail !== String(order.customer_email ?? "").trim().toLowerCase()) {
    const { error: emailErr } = await supabase
      .from("store_orders")
      .update({ customer_email: stripeEmail })
      .eq("id", input.orderId);
    if (emailErr) {
      console.warn("[ORDER_CONFIRMATION_EMAIL] no se pudo guardar email de Stripe", {
        orderId: input.orderId,
        error: emailErr.message,
      });
    }
  }

  if (!isUsableCustomerEmail(email)) {
    console.warn("[ORDER_CONFIRMATION_EMAIL]", {
      orderId: input.orderId,
      locale,
      template,
      status: "skipped_invalid_email",
    });
    return { sent: false };
  }

  const itemsRaw = order.store_order_items ?? [];
  const items: OrderConfirmationLineItem[] = (
    Array.isArray(itemsRaw) ? itemsRaw : []
  ).map((row) => ({
    productName: String(row.product_name ?? "").trim(),
    quantity: Number(row.quantity ?? 0),
    unitPrice: parseMoney(row.unit_price),
    totalPrice: parseMoney(row.total_price),
  }));

  if (items.length === 0) {
    console.warn("[ORDER_CONFIRMATION_EMAIL]", {
      orderId: input.orderId,
      locale,
      template,
      status: "skipped_no_items",
    });
    return { sent: false };
  }

  const shippingRaw = order.store_order_shipping_addresses;
  const shippingRow = Array.isArray(shippingRaw)
    ? shippingRaw[0]
    : shippingRaw ?? null;

  let shippingAddressLines: string[] =
    shippingRow && typeof shippingRow === "object"
      ? shippingAddressLinesFromDb(shippingRow)
      : input.session
        ? shippingAddressLinesFromStripeSession(input.session)
        : [];

  if (shippingAddressLines.length === 0 && stripeSession) {
    shippingAddressLines = shippingAddressLinesFromStripeSession(stripeSession);
  }

  if (
    order.stripe_session_id &&
    stripeSession &&
    stripeSession.payment_status !== "paid"
  ) {
    console.info("[ORDER_CONFIRMATION_EMAIL]", {
      orderId: input.orderId,
      locale,
      template,
      status: "skipped_unpaid",
    });
    return { sent: false };
  }

  const claimedSend = await claimConfirmationEmailSend(
    supabase,
    input.orderId,
    locale,
  );
  if (!claimedSend) {
    console.info("[ORDER_CONFIRMATION_EMAIL]", {
      orderId: input.orderId,
      locale,
      orderLocale: order.locale ?? null,
      template,
      status: "skipped_claim_taken",
    });
    return { sent: false };
  }

  const orderNumber =
    String(order.order_number ?? "").trim() || String(order.id).slice(0, 8);
  const subject = renderOrderConfirmationEmailSubject({ locale, orderNumber });

  console.info("[ORDER_CONFIRMATION_EMAIL]", {
    orderId: input.orderId,
    locale,
    orderLocale: order.locale ?? null,
    template,
    subject,
    status: "sending",
  });

  try {
    const result = await sendOrderConfirmationEmail(
      email,
      {
        locale,
        customerName: String(order.customer_name ?? "").trim(),
        orderNumber,
        orderDate: formatOrderDate(String(order.created_at ?? ""), locale),
        items,
        amountSubtotal: parseMoney(order.amount_subtotal),
        amountDiscount: parseMoney(order.amount_discount),
        amountTax: parseMoney(order.amount_tax),
        amountShipping: parseMoney(order.amount_shipping),
        totalAmount: parseMoney(order.total_amount),
        shippingAddressLines,
        orderLookupUrl: `${appUrl}/order-lookup`,
        profileOrdersUrl: storeOrderAccountOrdersUrl(appUrl, order.user_id),
      },
      {
        idempotencyKey: `order-confirmation-${input.orderId}`,
      },
    );

    if (!result.sent) {
      await releaseConfirmationEmailClaim(supabase, input.orderId);
      console.info("[ORDER_CONFIRMATION_EMAIL]", {
        orderId: input.orderId,
        locale,
        template,
        subject,
        status: "failed",
      });
      return { sent: false };
    }

    console.info("[ORDER_CONFIRMATION_EMAIL]", {
      orderId: input.orderId,
      locale,
      template,
      subject,
      status: "sent",
    });

    return { sent: true };
  } catch (err) {
    await releaseConfirmationEmailClaim(supabase, input.orderId);
    console.error("[ORDER_CONFIRMATION_EMAIL]", {
      orderId: input.orderId,
      locale,
      template,
      subject,
      status: "failed",
      error: err instanceof Error ? err.message : "unknown",
    });
    return { sent: false };
  }
}
