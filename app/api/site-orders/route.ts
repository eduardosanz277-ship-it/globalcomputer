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
    .min(1),
  sessionId: z.string().optional(),
});

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
    const order = await createSiteOrder({
      name: parsed.data.name,
      email: parsed.data.email,
      items: parsed.data.items,
      stripeSessionId: parsed.data.sessionId,
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
