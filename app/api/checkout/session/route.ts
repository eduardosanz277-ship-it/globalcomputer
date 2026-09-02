import { NextResponse } from "next/server";
import { z } from "zod";
import { formatServerErrorMessage } from "@/lib/errors/format-server-error";
import { isNetworkActionError } from "@/lib/errors/network-action-error";
import type { GcCartItem } from "@/lib/store-cart";
import {
  CheckoutSessionError,
  createHostedCheckoutSession,
} from "@/modules/commerce/stripe-checkout.service";

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        qty: z.number().int().min(1).max(999),
      }),
    )
    .min(1)
    .max(100),
  locale: z.enum(["es", "en"]),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON no válido." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos del carrito no válidos." },
      { status: 400 },
    );
  }

  const items: GcCartItem[] = parsed.data.items.map((i) => ({
    productId: i.productId,
    qty: i.qty,
  }));

  const locale = parsed.data.locale;

  try {
    console.info("[checkout/session] locale recibido del cliente", { locale });
    const { url } = await createHostedCheckoutSession(items, locale);
    return NextResponse.json({ url });
  } catch (e) {
    if (e instanceof CheckoutSessionError) {
      return NextResponse.json(
        { error: e.message },
        { status: e.statusCode },
      );
    }
    console.error("[checkout/session]", e);
    const network = isNetworkActionError(e);
    return NextResponse.json(
      {
        error: formatServerErrorMessage(e, locale),
        ...(network ? { code: "NETWORK" as const } : {}),
      },
      { status: network ? 503 : 500 },
    );
  }
}
