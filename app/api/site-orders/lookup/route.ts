import { NextResponse } from "next/server";
import { z } from "zod";
import { lookupStoreOrderByNumberAndEmail } from "@/modules/commerce/store-order-guest-lookup.service";

const bodySchema = z.object({
  orderNumber: z.string().trim().min(3).max(64),
  email: z.string().trim().email().max(200),
});

/** Consulta pública de pedido (invitados): nº de pedido + email. */
export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ code: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ code: "INVALID_BODY" }, { status: 400 });
  }

  try {
    const order = await lookupStoreOrderByNumberAndEmail(
      parsed.data.orderNumber,
      parsed.data.email,
    );
    if (!order) {
      return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (error) {
    console.error("site-orders lookup POST:", error);
    return NextResponse.json({ code: "SERVER_ERROR" }, { status: 500 });
  }
}
