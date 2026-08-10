import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createManualQuoteOrder,
  SiteOrderError,
} from "@/modules/commerce/store-orders.service";

export const dynamic = "force-dynamic";

const shippingAddressSchema = z.object({
  recipientName: z.string().trim().min(1).max(160),
  recipientPhone: z.string().trim().min(7).max(40),
  recipientEmail: z
    .string()
    .trim()
    .email()
    .max(160)
    .optional()
    .or(z.literal("")),
  addressLine: z.string().trim().min(1).max(200),
  addressLine2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().max(120).optional().or(z.literal("")),
  postalCode: z.string().trim().min(1).max(32),
  country: z.string().trim().min(2).max(80),
});

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
  shippingAddress: shippingAddressSchema,
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
    const addr = parsed.data.shippingAddress;
    const result = await createManualQuoteOrder({
      items: parsed.data.items,
      locale: parsed.data.locale,
      name: parsed.data.name ?? addr.recipientName,
      email:
        parsed.data.email ??
        (addr.recipientEmail ? addr.recipientEmail : undefined),
      shippingAddress: {
        recipientName: addr.recipientName,
        recipientPhone: addr.recipientPhone,
        recipientEmail: addr.recipientEmail || null,
        addressLine: addr.addressLine,
        addressLine2: addr.addressLine2 || null,
        city: addr.city,
        state: addr.state || null,
        postalCode: addr.postalCode,
        country: addr.country,
      },
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
