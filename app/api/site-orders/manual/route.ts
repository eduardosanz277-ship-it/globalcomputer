import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createManualQuoteOrder,
  SiteOrderError,
} from "@/modules/commerce/store-orders.service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        qty: z.number().int().min(1).max(999),
      }),
    )
    .min(1),
  locale: z.enum(["es", "en"]).optional(),
  name: z.string().min(1).max(160).optional(),
  email: z.string().email().optional(),
});

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos no válidos para solicitar la cotización." },
      { status: 400 },
    );
  }

  try {
    const result = await createManualQuoteOrder({
      items: parsed.data.items,
      locale: parsed.data.locale,
      name: parsed.data.name,
      email: parsed.data.email,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof SiteOrderError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("site-orders/manual POST:", error);
    return NextResponse.json(
      { error: "No se pudo crear el pedido de cotización." },
      { status: 500 },
    );
  }
}
