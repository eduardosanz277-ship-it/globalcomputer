import Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  activeDiscountPercent,
  priceAfterDiscount,
  resolveStorefrontPriceTier,
} from "@/lib/storefront-pricing";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { getStorefrontProductsByIds } from "@/modules/catalog/storefront-products.service";

export type SiteOrderStatus =
  | "confirmada"
  | "procesando"
  | "enviando"
  | "completada";

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
  customer_name: string;
  customer_email: string;
  status: SiteOrderStatus;
  total_amount: string;
  created_at: string;
  amount_subtotal: string;
  amount_tax: string;
  amount_shipping: string;
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
      .select(
        "id, customer_name, customer_email, status, total_amount, created_at, amount_subtotal, amount_tax, amount_shipping, stripe_amount_total, stripe_payment_status, stripe_payment_intent",
      )
      .eq("stripe_session_id", payload.stripeSessionId.trim())
      .maybeSingle();
    if (existing) {
      return {
        id: existing.id,
        customer_name: existing.customer_name,
        customer_email: existing.customer_email,
        status: existing.status as SiteOrderStatus,
        total_amount: existing.total_amount,
        created_at: existing.created_at,
        amount_subtotal: existing.amount_subtotal,
        amount_tax: existing.amount_tax,
        amount_shipping: existing.amount_shipping,
        stripe_amount_total: existing.stripe_amount_total,
        stripe_payment_status: existing.stripe_payment_status,
        stripe_payment_intent: existing.stripe_payment_intent,
      };
    }
  }
  const tier = resolveStorefrontPriceTier(user?.role);

  const productIds = [...new Set(payload.items.map((item) => item.productId))];
  const products = await getStorefrontProductsByIds(productIds);
  const productsById = Object.fromEntries(products.map((p) => [p.id, p]));

  let totalAmount = 0;
  const normalizedItems = payload.items.map((item) => {
    const product = productsById[item.productId];
    if (!product) {
      throw new SiteOrderError(`El producto ${item.productId} ya no existe.`, 400);
    }
    if (item.qty < 1) {
      throw new SiteOrderError("La cantidad debe ser al menos 1.", 400);
    }

    const pct = activeDiscountPercent(product, tier);
    const unitPrice = priceAfterDiscount(product.price, pct);
    const linePrice = unitPrice * item.qty;
    totalAmount += linePrice;

    return {
      product,
      qty: item.qty,
      unitPrice,
      totalPrice: Number((linePrice).toFixed(2)),
    };
  });

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
      status: "confirmada",
      total_amount: Number(totalAmount.toFixed(2)),
      amount_subtotal: Number(totalAmount.toFixed(2)),
      amount_tax: 0,
      amount_shipping: 0,
      stripe_amount_total: Number(totalAmount.toFixed(2)),
      stripe_payment_status: null,
      stripe_payment_intent: null,
    })
    .select(
      "id, customer_name, customer_email, status, total_amount, created_at, amount_subtotal, amount_tax, amount_shipping, stripe_amount_total, stripe_payment_status, stripe_payment_intent",
    )
    .maybeSingle();

  if (orderError?.code === "23505" && payload.stripeSessionId?.trim()) {
    const { data: dup } = await supabase
      .from("store_orders")
      .select(
        "id, customer_name, customer_email, status, total_amount, created_at, amount_subtotal, amount_tax, amount_shipping, stripe_amount_total, stripe_payment_status, stripe_payment_intent",
      )
      .eq("stripe_session_id", payload.stripeSessionId.trim())
      .maybeSingle();
    if (dup) {
      return {
        id: dup.id,
        customer_name: dup.customer_name,
        customer_email: dup.customer_email,
        status: dup.status as SiteOrderStatus,
        total_amount: dup.total_amount,
        created_at: dup.created_at,
        amount_subtotal: dup.amount_subtotal,
        amount_tax: dup.amount_tax,
        amount_shipping: dup.amount_shipping,
        stripe_amount_total: dup.stripe_amount_total,
        stripe_payment_status: dup.stripe_payment_status,
        stripe_payment_intent: dup.stripe_payment_intent,
      };
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

  return {
    id: order.id,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    status: order.status as SiteOrderStatus,
    total_amount: order.total_amount,
    created_at: order.created_at,
    amount_subtotal: order.amount_subtotal,
    amount_tax: order.amount_tax,
    amount_shipping: order.amount_shipping,
    stripe_amount_total: order.stripe_amount_total,
    stripe_payment_status: order.stripe_payment_status,
    stripe_payment_intent: order.stripe_payment_intent,
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
  const customerName =
    full.customer_details?.name?.trim() ||
    full.shipping_details?.name?.trim() ||
    "Cliente";

  const ref = full.client_reference_id?.trim();
  const userId = ref && isUuid(ref) ? ref : null;

  const paymentIntentId =
    typeof full.payment_intent === "string"
      ? full.payment_intent
      : full.payment_intent && typeof full.payment_intent === "object"
        ? full.payment_intent.id
        : null;

  const insertOrder = {
    user_id: userId,
    customer_name: customerName,
    customer_email: customerEmail,
    stripe_session_id: full.id,
    status: "confirmada" as SiteOrderStatus,
    total_amount: centsToMoney(full.amount_total),
    amount_subtotal: centsToMoney(full.amount_subtotal),
    amount_tax: centsToMoney(full.total_details?.amount_tax),
    amount_shipping: centsToMoney(full.total_details?.amount_shipping),
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

  const updates = {
    amount_subtotal: centsToMoney(session.amount_subtotal),
    amount_tax: centsToMoney(session.total_details?.amount_tax),
    amount_shipping: centsToMoney(session.total_details?.amount_shipping),
    stripe_amount_total: centsToMoney(session.amount_total),
    stripe_payment_status: session.payment_status ?? null,
    stripe_payment_intent:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent && typeof session.payment_intent === "object"
          ? session.payment_intent.id
          : null,
    status: session.payment_status === "paid" ? "procesando" : "confirmada",
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
