import Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { computeSiteOfferOnSubtotal } from "@/lib/site-offer-discount";
import { getPublicSiteOffer } from "@/lib/site-offer.server";
import {
  resolveStorefrontPriceTier,
  resolveStorefrontUnitPrice,
} from "@/lib/storefront-pricing";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { storefrontProductDisplayName } from "@/modules/catalog/storefront-product.shared";
import { getStorefrontProductsByIds } from "@/modules/catalog/storefront-products.service";
import {
  buildWhatsAppQuoteMessage,
  buildWhatsAppUrl,
  shouldRedirectToWhatsApp,
} from "@/modules/shipping/shipping.calculator";
import {
  getShippingSettingsService,
  quoteShippingService,
} from "@/modules/shipping/shipping.service";
import type { ShippingQuoteLineInput } from "@/modules/shipping/shipping.types";

export type SiteOrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipping"
  | "completed"
  | "cancelled";

export type StoreOrderShippingMethod = "automatic" | "manual";

export type SiteOrderItemInput = {
  productId: string;
  qty: number;
};

export type CreateSiteOrderInput = {
  name?: string;
  email?: string;
  items: SiteOrderItemInput[];
  stripeSessionId?: string;
};

export type SiteOrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: SiteOrderStatus;
  total_amount: string;
  created_at: string;
  amount_subtotal: string;
  amount_tax: string;
  amount_shipping: string;
  amount_discount: string;
  amount_shipping_base: string;
  amount_shipping_surcharge: string;
  shipping_method: StoreOrderShippingMethod;
  stripe_amount_total: string;
  stripe_payment_status: string | null;
  stripe_payment_intent: string | null;
};

export class SiteOrderError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = "SiteOrderError";
  }
}

const MINIMUM_ITEM_COUNT = 1;

const SITE_ORDER_SELECT =
  "id, order_number, customer_name, customer_email, status, total_amount, created_at, amount_subtotal, amount_tax, amount_shipping, amount_discount, amount_shipping_base, amount_shipping_surcharge, shipping_method, stripe_amount_total, stripe_payment_status, stripe_payment_intent";

type OrderPricingBreakdown = {
  amount_discount: number;
  amount_shipping_base: number;
  amount_shipping_surcharge: number;
  shipping_method: StoreOrderShippingMethod;
};

function getStripeServer(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new SiteOrderError("Pago no configurado (falta STRIPE_SECRET_KEY).", 503);
  }
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function parseMoneyMeta(raw: string | undefined | null): number {
  if (raw == null || raw === "") return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Number(n.toFixed(2));
}

function breakdownFromStripeMetadata(
  meta: Stripe.Metadata | null | undefined,
): OrderPricingBreakdown {
  return {
    amount_discount: parseMoneyMeta(meta?.amount_discount),
    amount_shipping_base: parseMoneyMeta(meta?.shipping_base),
    amount_shipping_surcharge: parseMoneyMeta(meta?.shipping_surcharges),
    shipping_method:
      meta?.shipping_method === "manual" ? "manual" : "automatic",
  };
}

function mapSiteOrderRow(row: {
  id: string;
  order_number?: string | null;
  customer_name: string;
  customer_email: string;
  status: string;
  total_amount: string | number;
  created_at: string;
  amount_subtotal: string | number;
  amount_tax: string | number;
  amount_shipping: string | number;
  amount_discount?: string | number | null;
  amount_shipping_base?: string | number | null;
  amount_shipping_surcharge?: string | number | null;
  shipping_method?: string | null;
  stripe_amount_total: string | number;
  stripe_payment_status: string | null;
  stripe_payment_intent: string | null;
}): SiteOrderRow {
  return {
    id: row.id,
    order_number: String(row.order_number ?? "").trim() || row.id,
    customer_name: row.customer_name,
    customer_email: row.customer_email,
    status: row.status as SiteOrderStatus,
    total_amount: String(row.total_amount),
    created_at: row.created_at,
    amount_subtotal: String(row.amount_subtotal),
    amount_tax: String(row.amount_tax),
    amount_shipping: String(row.amount_shipping),
    amount_discount: String(row.amount_discount ?? 0),
    amount_shipping_base: String(row.amount_shipping_base ?? 0),
    amount_shipping_surcharge: String(row.amount_shipping_surcharge ?? 0),
    shipping_method:
      row.shipping_method === "manual" ? "manual" : "automatic",
    stripe_amount_total: String(row.stripe_amount_total),
    stripe_payment_status: row.stripe_payment_status,
    stripe_payment_intent: row.stripe_payment_intent,
  };
}

async function resolveOrderPricingBreakdown(input: {
  subtotal: number;
  lines: ShippingQuoteLineInput[];
  stripeSessionId?: string;
}): Promise<OrderPricingBreakdown> {
  if (input.stripeSessionId?.trim()) {
    try {
      const stripe = getStripeServer();
      const session = await stripe.checkout.sessions.retrieve(
        input.stripeSessionId.trim(),
      );
      if (session.metadata) {
        return breakdownFromStripeMetadata(session.metadata);
      }
    } catch {
      /* fallback local */
    }
  }

  const offer = await getPublicSiteOffer();
  const { discountUsd } = computeSiteOfferOnSubtotal(input.subtotal, offer);
  const quote = await quoteShippingService({
    subtotal: input.subtotal,
    lines: input.lines,
  });

  if (quote.requiresQuote) {
    return {
      amount_discount: discountUsd,
      amount_shipping_base: 0,
      amount_shipping_surcharge: 0,
      shipping_method: "manual",
    };
  }

  return {
    amount_discount: discountUsd,
    amount_shipping_base: quote.baseRate,
    amount_shipping_surcharge: quote.surchargesTotal,
    shipping_method: "automatic",
  };
}

export async function createSiteOrder(
  payload: CreateSiteOrderInput,
): Promise<SiteOrderRow> {
  if (payload.items.length < MINIMUM_ITEM_COUNT) {
    throw new SiteOrderError("El carrito debe tener al menos un producto.");
  }

  const user = await getCurrentUserService();
  const supabase = createSupabaseAdminClient();

  if (payload.stripeSessionId?.trim()) {
    const { data: existing } = await supabase
      .from("store_orders")
      .select(SITE_ORDER_SELECT)
      .eq("stripe_session_id", payload.stripeSessionId.trim())
      .maybeSingle();
    if (existing) {
      return mapSiteOrderRow(existing);
    }
  }
  const tier = resolveStorefrontPriceTier(user?.role);

  const productIds = [...new Set(payload.items.map((item) => item.productId))];
  const products = await getStorefrontProductsByIds(productIds);
  const productsById = Object.fromEntries(products.map((p) => [p.id, p]));

  let totalAmount = 0;
  const shippingLines: ShippingQuoteLineInput[] = [];
  const normalizedItems = payload.items.map((item) => {
    const product = productsById[item.productId];
    if (!product) {
      throw new SiteOrderError(`El producto ${item.productId} ya no existe.`, 400);
    }
    if (item.qty < 1) {
      throw new SiteOrderError("La cantidad debe ser al menos 1.", 400);
    }

    const unitPrice = resolveStorefrontUnitPrice(product, tier);
    const linePrice = unitPrice * item.qty;
    totalAmount += linePrice;
    shippingLines.push({
      productId: product.id,
      quantity: item.qty,
      shippingType: product.shipping_type ?? "standard",
      shippingSurchargePerUnit: product.shipping_surcharge_per_unit ?? 0,
    });

    return {
      product,
      qty: item.qty,
      unitPrice,
      totalPrice: Number(linePrice.toFixed(2)),
    };
  });

  const pricing = await resolveOrderPricingBreakdown({
    subtotal: totalAmount,
    lines: shippingLines,
    stripeSessionId: payload.stripeSessionId,
  });
  const shippingTotal =
    pricing.shipping_method === "manual"
      ? 0
      : Number(
          (
            pricing.amount_shipping_base + pricing.amount_shipping_surcharge
          ).toFixed(2),
        );

  const customerName =
    payload.name?.trim() || user?.fullName?.trim() || "Cliente";
  const customerEmail =
    payload.email?.trim() || user?.email?.trim() || "cliente@globalcomputer.com";

  const { data: order, error: orderError } = await supabase
    .from("store_orders")
    .insert({
      user_id: user?.id ?? null,
      customer_name: customerName,
      customer_email: customerEmail,
      stripe_session_id: payload.stripeSessionId ?? null,
      status: "confirmed",
      total_amount: Number(totalAmount.toFixed(2)),
      amount_subtotal: Number(totalAmount.toFixed(2)),
      amount_tax: 0,
      amount_shipping: shippingTotal,
      amount_discount: pricing.amount_discount,
      amount_shipping_base: pricing.amount_shipping_base,
      amount_shipping_surcharge: pricing.amount_shipping_surcharge,
      shipping_method: pricing.shipping_method,
      stripe_amount_total: Number(totalAmount.toFixed(2)),
      stripe_payment_status: null,
      stripe_payment_intent: null,
    })
    .select(SITE_ORDER_SELECT)
    .maybeSingle();

  if (orderError?.code === "23505" && payload.stripeSessionId?.trim()) {
    const { data: dup } = await supabase
      .from("store_orders")
      .select(SITE_ORDER_SELECT)
      .eq("stripe_session_id", payload.stripeSessionId.trim())
      .maybeSingle();
    if (dup) {
      return mapSiteOrderRow(dup);
    }
  }

  if (orderError || !order) {
    throw new SiteOrderError("No se pudo registrar el pedido.", 500);
  }

  const orderItems = normalizedItems.map((line) => ({
    store_order_id: order.id,
    product_id: line.product.id,
    product_name: line.product.name,
    quantity: line.qty,
    unit_price: Number(line.unitPrice.toFixed(2)),
    total_price: Number(line.totalPrice.toFixed(2)),
  }));

  const { error: itemsError } = await supabase
    .from("store_order_items")
    .insert(orderItems);
  if (itemsError) {
    throw new SiteOrderError("No se pudieron guardar las líneas del pedido.", 500);
  }

  return mapSiteOrderRow(order);
}

export type CreateManualQuoteOrderInput = {
  items: SiteOrderItemInput[];
  locale?: string | null;
  name?: string;
  email?: string;
};

export type CreateManualQuoteOrderResult = {
  order: SiteOrderRow;
  whatsappUrl: string;
};

/**
 * Pedido manual por cotización WhatsApp: status pending, sin envío en el total.
 */
export async function createManualQuoteOrder(
  payload: CreateManualQuoteOrderInput,
): Promise<CreateManualQuoteOrderResult> {
  if (payload.items.length < MINIMUM_ITEM_COUNT) {
    throw new SiteOrderError("El carrito debe tener al menos un producto.");
  }

  const user = await getCurrentUserService();
  const tier = resolveStorefrontPriceTier(user?.role);
  const locale = payload.locale === "en" ? "en" : "es";

  const productIds = [...new Set(payload.items.map((item) => item.productId))];
  const [products, offer, settings] = await Promise.all([
    getStorefrontProductsByIds(productIds),
    getPublicSiteOffer(),
    getShippingSettingsService(),
  ]);
  const productsById = Object.fromEntries(products.map((p) => [p.id, p]));

  let subtotal = 0;
  const shippingLines: ShippingQuoteLineInput[] = [];
  const normalizedItems: {
    product: (typeof products)[number];
    qty: number;
    unitPrice: number;
    totalPrice: number;
  }[] = [];

  for (const item of payload.items) {
    const product = productsById[item.productId];
    if (!product) {
      throw new SiteOrderError(`El producto ${item.productId} ya no existe.`, 400);
    }
    const qty = Math.max(0, Math.floor(item.qty));
    if (qty < 1) {
      throw new SiteOrderError("La cantidad debe ser al menos 1.", 400);
    }
    const unitPrice = resolveStorefrontUnitPrice(product, tier);
    const linePrice = unitPrice * qty;
    subtotal += linePrice;
    shippingLines.push({
      productId: product.id,
      quantity: qty,
      shippingType: product.shipping_type ?? "standard",
      shippingSurchargePerUnit: product.shipping_surcharge_per_unit ?? 0,
      productName: storefrontProductDisplayName(product, locale),
      unitPrice,
    });
    normalizedItems.push({
      product,
      qty,
      unitPrice,
      totalPrice: Number(linePrice.toFixed(2)),
    });
  }

  subtotal = Number(subtotal.toFixed(2));
  if (!shouldRedirectToWhatsApp(subtotal, settings.autoCalcMaxSubtotal)) {
    throw new SiteOrderError(
      "Este pedido no requiere cotización manual de envío.",
      400,
    );
  }

  const { discountUsd, totalAfterDiscountUsd } = computeSiteOfferOnSubtotal(
    subtotal,
    offer,
  );
  const merchandiseTotal = Number(totalAfterDiscountUsd.toFixed(2));

  const customerName =
    payload.name?.trim() || user?.fullName?.trim() || "Cliente";
  const customerEmail =
    payload.email?.trim() || user?.email?.trim() || "cliente@globalcomputer.com";

  const supabase = createSupabaseAdminClient();
  const { data: order, error: orderError } = await supabase
    .from("store_orders")
    .insert({
      user_id: user?.id ?? null,
      customer_name: customerName,
      customer_email: customerEmail,
      stripe_session_id: null,
      status: "pending",
      total_amount: merchandiseTotal,
      amount_subtotal: subtotal,
      amount_tax: 0,
      amount_shipping: 0,
      amount_discount: discountUsd,
      amount_shipping_base: 0,
      amount_shipping_surcharge: 0,
      shipping_method: "manual",
      stripe_amount_total: 0,
      stripe_payment_status: null,
      stripe_payment_intent: null,
    })
    .select(SITE_ORDER_SELECT)
    .maybeSingle();

  if (orderError || !order) {
    console.error("[store-orders] create manual quote", orderError);
    throw new SiteOrderError("No se pudo registrar el pedido.", 500);
  }

  const { error: itemsError } = await supabase.from("store_order_items").insert(
    normalizedItems.map((line) => ({
      store_order_id: order.id,
      product_id: line.product.id,
      product_name: storefrontProductDisplayName(line.product, locale),
      quantity: line.qty,
      unit_price: Number(line.unitPrice.toFixed(2)),
      total_price: Number(line.totalPrice.toFixed(2)),
    })),
  );
  if (itemsError) {
    console.error("[store-orders] create manual quote items", itemsError);
    throw new SiteOrderError("No se pudieron guardar las líneas del pedido.", 500);
  }

  const intro =
    locale === "en"
      ? settings.whatsappMessageEn.trim() || settings.whatsappMessage
      : settings.whatsappMessage;
  const message = buildWhatsAppQuoteMessage(
    intro,
    shippingLines,
    subtotal,
    offer,
    locale,
    order.order_number,
  );
  const whatsappUrl = buildWhatsAppUrl(settings.whatsappPhone, message);
  if (!whatsappUrl) {
    throw new SiteOrderError(
      "Configura el WhatsApp de envíos en el panel admin.",
      400,
    );
  }

  return {
    order: mapSiteOrderRow(order),
    whatsappUrl,
  };
}

function centsToMoney(cents?: number | null): number {
  if (!cents || !Number.isFinite(cents)) return 0;
  return Number((cents / 100).toFixed(2));
}

function productIdFromStripeLineItem(line: Stripe.LineItem): string | null {
  const price = line.price;
  if (!price || typeof price === "string") return null;
  const product = price.product;
  if (typeof product === "string") return null;
  if (
    product &&
    typeof product === "object" &&
    "deleted" in product &&
    (product as { deleted?: boolean }).deleted
  ) {
    return null;
  }
  const raw = (product as Stripe.Product | undefined)?.metadata?.product_id?.trim();
  return raw && isUuid(raw) ? raw : null;
}

/**
 * Si el cliente no llegó a registrar el pedido (carrito vacío en /exito, etc.),
 * crea filas desde la sesión de Stripe (metadata product_id en líneas del checkout).
 */
async function ensureStoreOrderForCheckoutSession(
  sessionId: string,
  supabase: ReturnType<typeof createSupabaseAdminClient>,
): Promise<string> {
  const { data: existing } = await supabase
    .from("store_orders")
    .select("id")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const stripe = getStripeServer();
  const full = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items.data.price.product"],
  });

  const lines = full.line_items?.data ?? [];
  type LineRow = {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  };
  const itemRows: LineRow[] = [];

  for (const line of lines) {
    const productId = productIdFromStripeLineItem(line);
    if (!productId) {
      console.error("[store-orders] línea sin product_id en metadata de Stripe", line.id);
      continue;
    }
    const qty = line.quantity ?? 1;
    const subCents = line.amount_subtotal ?? 0;
    const totalCents = line.amount_total ?? subCents;
    const unitPrice =
      qty > 0 ? Number((subCents / qty / 100).toFixed(2)) : 0;
    const totalPrice = Number((totalCents / 100).toFixed(2));
    const priceProduct = line.price?.product;
    const nameFromProduct =
      typeof priceProduct === "object" &&
      priceProduct &&
      !("deleted" in priceProduct && (priceProduct as { deleted?: boolean }).deleted)
        ? (priceProduct as Stripe.Product).name?.trim()
        : undefined;
    const productName =
      line.description?.trim() || nameFromProduct || "Producto";

    itemRows.push({
      product_id: productId,
      product_name: productName,
      quantity: qty,
      unit_price: unitPrice,
      total_price: totalPrice,
    });
  }

  if (itemRows.length === 0) {
    throw new Error(
      `[store-orders] no hay líneas válidas para la sesión ${sessionId} (falta metadata product_id en Checkout).`,
    );
  }

  const customerEmail =
    full.customer_details?.email?.trim() ||
    full.customer_email?.trim() ||
    "cliente@globalcomputer.com";
  const shippingName =
    (
      full as Stripe.Response<Stripe.Checkout.Session> & {
        shipping_details?: { name?: string | null };
      }
    ).shipping_details?.name?.trim() ?? null;
  const customerName =
    full.customer_details?.name?.trim() ||
    shippingName ||
    "Cliente";

  const ref = full.client_reference_id?.trim();
  const userId = ref && isUuid(ref) ? ref : null;

  const paymentIntentId =
    typeof full.payment_intent === "string"
      ? full.payment_intent
      : full.payment_intent && typeof full.payment_intent === "object"
        ? full.payment_intent.id
        : null;

  const pricing = breakdownFromStripeMetadata(full.metadata);

  const insertOrder = {
    user_id: userId,
    customer_name: customerName,
    customer_email: customerEmail,
    stripe_session_id: full.id,
    status: "confirmed" as SiteOrderStatus,
    total_amount: centsToMoney(full.amount_total),
    amount_subtotal: centsToMoney(full.amount_subtotal),
    amount_tax: centsToMoney(full.total_details?.amount_tax),
    amount_shipping: centsToMoney(full.total_details?.amount_shipping),
    amount_discount: pricing.amount_discount,
    amount_shipping_base: pricing.amount_shipping_base,
    amount_shipping_surcharge: pricing.amount_shipping_surcharge,
    shipping_method: pricing.shipping_method,
    stripe_amount_total: centsToMoney(full.amount_total),
    stripe_payment_status: full.payment_status ?? null,
    stripe_payment_intent: paymentIntentId,
  };

  const { data: inserted, error: orderErr } = await supabase
    .from("store_orders")
    .insert(insertOrder)
    .select("id")
    .maybeSingle();

  if (orderErr?.code === "23505") {
    const { data: dup } = await supabase
      .from("store_orders")
      .select("id")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();
    if (dup?.id) return dup.id;
  }

  if (orderErr || !inserted?.id) {
    console.error("[store-orders] insert pedido desde webhook", orderErr);
    throw orderErr ?? new Error("No se pudo crear el pedido desde Stripe.");
  }

  const orderId = inserted.id;
  const { error: itemsErr } = await supabase.from("store_order_items").insert(
    itemRows.map((r) => ({
      store_order_id: orderId,
      product_id: r.product_id,
      product_name: r.product_name,
      quantity: r.quantity,
      unit_price: r.unit_price,
      total_price: r.total_price,
    })),
  );
  if (itemsErr) {
    console.error("[store-orders] insert líneas desde webhook", itemsErr);
    throw itemsErr;
  }

  return orderId;
}

export async function syncOrderWithStripeSession(
  session: Stripe.Checkout.Session,
  eventId: string,
  eventType: string,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  let { data: order } = await supabase
    .from("store_orders")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  if (!order?.id) {
    const id = await ensureStoreOrderForCheckoutSession(session.id, supabase);
    order = { id };
  }

  const pricing = breakdownFromStripeMetadata(session.metadata);

  const updates = {
    amount_subtotal: centsToMoney(session.amount_subtotal),
    amount_tax: centsToMoney(session.total_details?.amount_tax),
    amount_shipping: centsToMoney(session.total_details?.amount_shipping),
    amount_discount: pricing.amount_discount,
    amount_shipping_base: pricing.amount_shipping_base,
    amount_shipping_surcharge: pricing.amount_shipping_surcharge,
    shipping_method: pricing.shipping_method,
    stripe_amount_total: centsToMoney(session.amount_total),
    stripe_payment_status: session.payment_status ?? null,
    stripe_payment_intent:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent && typeof session.payment_intent === "object"
          ? session.payment_intent.id
          : null,
    status: session.payment_status === "paid" ? "processing" : "confirmed",
  };

  const { error: upErr } = await supabase
    .from("store_orders")
    .update(updates)
    .eq("id", order.id);
  if (upErr) {
    console.error("[store-orders] actualizar tras webhook", upErr);
    throw upErr;
  }

  const { error: evErr } = await supabase.from("store_order_webhook_events").upsert(
    {
      store_order_id: order.id,
      stripe_event_id: eventId,
      event_type: eventType,
      payload: session as unknown as Record<string, unknown>,
    },
    { onConflict: "store_order_id,stripe_event_id" },
  );
  if (evErr) {
    console.error("[store-orders] webhook event", evErr);
    throw evErr;
  }
}
