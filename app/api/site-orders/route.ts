import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSiteOrder,
  getStoreOrderNumberByStripeSessionId,
  SiteOrderError,
} from "@/modules/commerce/store-orders.service";

const siteOrderSchema = z.object({
  name: z.string().min(1).max(160).optional(),
  email: z.string().email().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        qty: z.number().int().min(1).max(999),
      }),
    )
    .optional()
    .default([]),
  sessionId: z.string().optional(),
  locale: z.enum(["es", "en"]),
});

/** Consulta el nº de pedido asociado a una sesión de Stripe Checkout. */
export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("session_id")?.trim();
  if (!sessionId) {
    return NextResponse.json(
      { error: "Falta session_id." },
      { status: 400 },
    );
  }

  try {
    const orderNumber = await getStoreOrderNumberByStripeSessionId(sessionId);
    if (!orderNumber) {
      return NextResponse.json({ orderNumber: null }, { status: 404 });
    }
    return NextResponse.json({ orderNumber });
  } catch (error) {
    console.error("site-orders GET:", error);
    return NextResponse.json(
      { error: "No se pudo consultar el pedido." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = siteOrderSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos no válidos para registrar el pedido." }, { status: 400 });
  }

  try {
    const locale = parsed.data.locale;
    const order = await createSiteOrder({
      name: parsed.data.name,
      email: parsed.data.email,
      items: parsed.data.items,
      stripeSessionId: parsed.data.sessionId,
      locale,
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (error instanceof SiteOrderError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("site-orders POST:", error);
    return NextResponse.json({ error: "No se pudo guardar el pedido." }, { status: 500 });
  }
}
