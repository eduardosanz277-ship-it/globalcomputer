import { syncOrderWithStripeSession } from "@/modules/commerce/store-orders.service";
import { NextResponse } from "next/server";
import Stripe from "stripe";


export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripeSecret =
    process.env.STRIPE_SECRET_KEY ?? process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecret) {
    throw new Error("Falta STRIPE_SECRET_KEY para el webhook de Stripe.");
  }

  if (!stripeWebhookSecret) {
    throw new Error("Falta STRIPE_WEBHOOK_SECRET para validar el webhook.");
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: "2026-03-25.dahlia" });

  const signature = req.headers.get("stripe-signature") ?? "";
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      stripeWebhookSecret!,
    );
  } catch (error) {
    console.error("stripe webhook signature error", error);
    return NextResponse.json({ error: "Webhook signature inválida." }, { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    await syncOrderWithStripeSession(session, event.id, event.type);
  }

  return NextResponse.json({ received: true });
}
