import type Stripe from "stripe";
import { getAppBaseUrl } from "@/lib/app-url";
import { sendOrderConfirmationEmail } from "@/lib/email/sendOrderConfirmationEmail";
import type { OrderConfirmationLineItem } from "@/lib/email/templates/orderConfirmationTemplate";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

type SupabaseAdmin = ReturnType<typeof createSupabaseAdminClient>;

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

function shippingLinesFromStripeSession(
  session: Stripe.Checkout.Session,
): string[] {
  const lines: string[] = [];
  const name =
    (
      session as Stripe.Checkout.Session & {
        shipping_details?: { name?: string | null };
      }
    ).shipping_details?.name?.trim() ||
    session.customer_details?.name?.trim();
  if (name) lines.push(name);

  const shippingAddress =
    (
      session as Stripe.Checkout.Session & {
        shipping_details?: {
          address?: Stripe.Address | null;
        };
      }
    ).shipping_details?.address ?? session.customer_details?.address;

  if (shippingAddress) {
    const street = [shippingAddress.line1, shippingAddress.line2]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(", ");
    if (street) lines.push(street);

    const cityLine = [
      shippingAddress.postal_code?.trim(),
      shippingAddress.city?.trim(),
      shippingAddress.state?.trim(),
    ]
      .filter(Boolean)
      .join(" ");
    if (cityLine) lines.push(cityLine);

    if (shippingAddress.country?.trim()) {
      lines.push(shippingAddress.country.trim().toUpperCase());
    }
  }

  const phone = session.customer_details?.phone?.trim();
  if (phone) lines.push(phone);

  return lines;
}

function shippingLinesFromDb(row: {
  recipient_name?: string | null;
  recipient_phone?: string | null;
  address_line?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
}): string[] {
  const lines: string[] = [];
  const name = row.recipient_name?.trim();
  if (name) lines.push(name);

  const street = [row.address_line, row.address_line_2]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
  if (street) lines.push(street);

  const cityLine = [row.postal_code, row.city, row.state]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  if (cityLine) lines.push(cityLine);

  if (row.country?.trim()) lines.push(row.country.trim().toUpperCase());

  const phone = row.recipient_phone?.trim();
  if (phone) lines.push(phone);

  return lines;
}

/**
 * Envía confirmación de compra cuando el pedido está en estado `confirmed` (pago confirmado).
 * No lanza error si falla el correo (no debe bloquear checkout ni webhook).
 */
export async function maybeSendStoreOrderConfirmationEmail(input: {
  orderId: string;
  session?: Stripe.Checkout.Session;
  supabase?: SupabaseAdmin;
}): Promise<{ sent: boolean }> {
  const supabase = input.supabase ?? createSupabaseAdminClient();
  const locale: "es" | "en" = "es";
  const appUrl = getAppBaseUrl();

  const { data: order, error } = await supabase
    .from("store_orders")
    .select(
      "id, order_number, customer_name, customer_email, status, stripe_session_id, created_at, total_amount, amount_subtotal, amount_tax, amount_shipping, amount_discount, store_order_items ( product_name, quantity, unit_price, total_price ), store_order_shipping_addresses ( recipient_name, recipient_phone, address_line, address_line_2, city, state, postal_code, country )",
    )
    .eq("id", input.orderId)
    .maybeSingle();

  if (error || !order) {
    console.error("[email] confirmación pedido: no se pudo cargar pedido", error);
    return { sent: false };
  }

  if (order.status !== "confirmed") {
    return { sent: false };
  }

  const email = String(order.customer_email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    console.warn("[email] confirmación pedido: correo inválido", input.orderId);
    return { sent: false };
  }

  const itemsRaw = order.store_order_items ?? [];
  const items: OrderConfirmationLineItem[] = (
    Array.isArray(itemsRaw) ? itemsRaw : []
  ).map((row) => ({
    productName: String(row.product_name ?? "Producto"),
    quantity: Number(row.quantity ?? 0),
    unitPrice: parseMoney(row.unit_price),
    totalPrice: parseMoney(row.total_price),
  }));

  if (items.length === 0) {
    console.warn("[email] confirmación pedido: sin líneas", input.orderId);
    return { sent: false };
  }

  const shippingRaw = order.store_order_shipping_addresses;
  const shippingRow = Array.isArray(shippingRaw)
    ? shippingRaw[0]
    : shippingRaw ?? null;

  let shippingAddressLines: string[] =
    shippingRow && typeof shippingRow === "object"
      ? shippingLinesFromDb(shippingRow)
      : input.session
        ? shippingLinesFromStripeSession(input.session)
        : [];

  let stripeSession = input.session;
  if (!stripeSession && order.stripe_session_id?.trim()) {
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
      console.warn("[email] confirmación pedido: no se pudo cargar sesión Stripe", err);
    }
  }

  if (shippingAddressLines.length === 0 && stripeSession) {
    shippingAddressLines = shippingLinesFromStripeSession(stripeSession);
  }

  if (stripeSession && stripeSession.payment_status !== "paid") {
    return { sent: false };
  }

  const orderNumber =
    String(order.order_number ?? "").trim() || String(order.id).slice(0, 8);

  try {
    const result = await sendOrderConfirmationEmail(email, {
      locale,
      customerName: String(order.customer_name ?? "Cliente"),
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
      profileOrdersUrl: `${appUrl}/profile?tab=orders`,
    });

    if (result.sent) {
      console.info("[email] confirmación de pedido enviada", {
        orderId: input.orderId,
        orderNumber,
        to: email,
      });
    }

    return result;
  } catch (err) {
    console.error("[email] confirmación pedido: error inesperado", err);
    return { sent: false };
  }
}
