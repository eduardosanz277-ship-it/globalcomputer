import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { ensureAdminUserService } from "@/modules/auth/auth.service";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { recordStoreOrderStatusChange } from "@/modules/commerce/store-order-status-history";
import { sendCustomerInventoryConflictEmail } from "@/lib/email/sendCustomerInventoryConflictEmail";
import { getAppBaseUrl } from "@/lib/app-url";
import { resolveAppLocale } from "@/lib/i18n/parse-locale";
import type { Locale } from "@/components/i18n/translations";

const bodySchema = z.object({
  orderId: z.string().uuid(),
});

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY no configurado.");
  return new Stripe(key, { typescript: true });
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const { orderId } = parsed.data;

  try {
    const admin = await ensureAdminUserService();
    const supabase = createSupabaseAdminClient();

    // Load order
    const { data: order, error: fetchError } = await supabase
      .from("store_orders")
      .select(
        "id, order_number, status, inventory_status, stripe_session_id, customer_name, customer_email, total_amount, stripe_amount_total, shipping_method, locale",
      )
      .eq("id", orderId)
      .maybeSingle();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
    }

    if (order.inventory_status !== "conflict") {
      return NextResponse.json(
        { error: "Este pedido no tiene un conflicto de inventario activo.", code: "NO_CONFLICT" },
        { status: 400 },
      );
    }

    if (!order.stripe_session_id) {
      return NextResponse.json(
        { error: "Este pedido no tiene sesión de Stripe asociada.", code: "NO_STRIPE_SESSION" },
        { status: 400 },
      );
    }

    // Get payment intent from Stripe session
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id, {
      expand: ["payment_intent"],
    });

    const paymentIntent =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    if (!paymentIntent) {
      return NextResponse.json(
        { error: "No se encontró el payment intent de Stripe.", code: "NO_PAYMENT_INTENT" },
        { status: 400 },
      );
    }

    // Issue refund
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntent,
      reason: "requested_by_customer",
      metadata: {
        order_id: orderId,
        order_number: String(order.order_number ?? ""),
        reason: "inventory_conflict",
        refunded_by: admin.id,
      },
    });

    if (refund.status !== "succeeded" && refund.status !== "pending") {
      return NextResponse.json(
        { error: `Reembolso fallido (estado Stripe: ${refund.status}).`, code: "REFUND_FAILED" },
        { status: 500 },
      );
    }

    // Cancel order and clear conflict status
    const previousStatus = order.status as string;
    await supabase
      .from("store_orders")
      .update({ status: "cancelled", inventory_status: null })
      .eq("id", orderId);

    // Audit record (Punto 6)
    await recordStoreOrderStatusChange({
      orderId,
      status: "cancelled",
      previousStatus: previousStatus as never,
      changedBy: admin.id,
      note: `Refund issued due to an inventory conflict. Stripe refund ID: ${refund.id}`,
      supabase,
    });

    // Customer notification email
    try {
      const customerEmail = String(order.customer_email ?? "").trim().toLowerCase();
      const appUrl = getAppBaseUrl();
      const locale = resolveAppLocale(order.locale) as Locale;
      const displayTotal =
        order.shipping_method === "manual"
          ? Number(order.total_amount ?? 0)
          : Number(order.stripe_amount_total ?? 0);

      if (customerEmail && customerEmail.includes("@")) {
        await sendCustomerInventoryConflictEmail(customerEmail, {
          locale,
          customerName: String(order.customer_name ?? ""),
          orderNumber: String(order.order_number ?? "").trim() || orderId.slice(0, 8),
          totalAmount: formatUsd(displayTotal),
          orderLookupUrl: `${appUrl}/order-lookup`,
        });
      }
    } catch (emailErr) {
      console.error("[refund] error enviando email al cliente", emailErr);
    }

    console.info("[refund] reembolso emitido", {
      orderId,
      refundId: refund.id,
      refundStatus: refund.status,
      adminId: admin.id,
    });

    return NextResponse.json({ ok: true, refundId: refund.id, refundStatus: refund.status });
  } catch (error) {
    console.error("admin/store-orders refund", error);
    const msg = error instanceof Error ? error.message : "";
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }
    if ((error as { type?: string }).type === "StripeInvalidRequestError") {
      return NextResponse.json(
        { error: "Error en Stripe: " + msg, code: "STRIPE_ERROR" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "No se pudo emitir el reembolso." }, { status: 500 });
  }
}
