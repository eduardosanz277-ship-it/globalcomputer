import Stripe from "stripe";
import { NextResponse } from "next/server";
import { syncOrderWithStripeSession } from "@/modules/commerce/store-orders.service";

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

export const runtime = "edge";

export async function POST(req: Request) {
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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await syncOrderWithStripeSession(session, event.id, event.type);
  }

  return NextResponse.json({ received: true });
}
