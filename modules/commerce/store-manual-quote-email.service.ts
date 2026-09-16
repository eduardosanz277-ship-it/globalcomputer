import { getAppBaseUrl } from "@/lib/app-url";
import { storeOrderAccountOrdersUrl } from "@/lib/email/order-confirmation-locale";
import { resolveAppLocale } from "@/lib/i18n/parse-locale";
import { sendManualQuoteRequestEmail } from "@/lib/email/sendManualQuoteRequestEmail";
import { mapOrderEmailLineItems } from "@/lib/email/map-order-email-line-items.server";
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

function shippingLinesFromDb(row: {
  recipient_name?: string | null;
  recipient_phone?: string | null;
  recipient_email?: string | null;
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

  // const email = row.recipient_email?.trim();
  // if (email) lines.push(email);

  return lines;
}

/**
 * Envía aviso de solicitud de cotización al crear un pedido manual (pending).
 * No lanza error si falla el correo.
 */
export async function maybeSendManualQuoteRequestEmail(input: {
  orderId: string;
  locale?: "es" | "en" | string | null;
  supabase?: SupabaseAdmin;
}): Promise<{ sent: boolean }> {
  const supabase = input.supabase ?? createSupabaseAdminClient();
  const appUrl = getAppBaseUrl();

  const { data: order, error } = await supabase
    .from("store_orders")
    .select(
      "id, order_number, customer_name, customer_email, user_id, status, locale, shipping_method, created_at, total_amount, amount_subtotal, amount_discount, store_order_items ( product_id, product_name, product_sku, quantity, unit_price, total_price ), store_order_shipping_addresses ( recipient_name, recipient_phone, recipient_email, address_line, address_line_2, city, state, postal_code, country )",
    )
    .eq("id", input.orderId)
    .maybeSingle();

  if (error || !order) {
    console.error("[email] cotización manual: no se pudo cargar pedido", error);
    return { sent: false };
  }

  if (order.status !== "pending" || order.shipping_method !== "manual") {
    return { sent: false };
  }

  // Prioridad: locale del request (UI) > fila en BD.
  const locale = resolveAppLocale(input.locale, order.locale);

  const email = String(order.customer_email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    console.warn("[email] cotización manual: correo inválido", input.orderId);
    return { sent: false };
  }

  const itemsRaw = order.store_order_items ?? [];
  const items: OrderConfirmationLineItem[] = await mapOrderEmailLineItems(
    supabase,
    Array.isArray(itemsRaw) ? itemsRaw : [],
    { appUrl, fallbackProductName: "Producto" },
  );

  if (items.length === 0) {
    console.warn("[email] cotización manual: sin líneas", input.orderId);
    return { sent: false };
  }

  const shippingRaw = order.store_order_shipping_addresses;
  const shippingRow = Array.isArray(shippingRaw)
    ? shippingRaw[0]
    : shippingRaw ?? null;

  const shippingAddressLines =
    shippingRow && typeof shippingRow === "object"
      ? shippingLinesFromDb(shippingRow)
      : [];

  const orderNumber =
    String(order.order_number ?? "").trim() || String(order.id).slice(0, 8);

  try {
    const result = await sendManualQuoteRequestEmail(email, {
      locale,
      customerName: String(order.customer_name ?? "Cliente"),
      orderNumber,
      orderDate: formatOrderDate(String(order.created_at ?? ""), locale),
      items,
      amountSubtotal: parseMoney(order.amount_subtotal),
      amountDiscount: parseMoney(order.amount_discount),
      merchandiseTotal: parseMoney(order.total_amount),
      shippingAddressLines,
      orderLookupUrl: `${appUrl}/order-lookup`,
      profileOrdersUrl: storeOrderAccountOrdersUrl(appUrl, order.user_id),
    });

    if (result.sent) {
      console.info("[email] solicitud de cotización enviada", {
        orderId: input.orderId,
        orderNumber,
        to: email,
      });
    }

    return result;
  } catch (err) {
    console.error("[email] cotización manual: error inesperado", err);
    return { sent: false };
  }
}
