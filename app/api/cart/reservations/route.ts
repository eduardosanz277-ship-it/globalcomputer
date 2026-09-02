import { NextResponse } from "next/server";
import { z } from "zod";
import { isNetworkActionError } from "@/lib/errors/network-action-error";
import {
  clearCartReservations,
  reserveCartItem,
  CartReservationError,
} from "@/modules/commerce/cart-reservations.service";

const HEADER_CART_TOKEN = "x-gc-cart-token";

function extractCartToken(req: Request): string | null {
  const header = req.headers.get(HEADER_CART_TOKEN);
  if (!header) return null;
  const token = header.trim();
  return token === "" ? null : token;
}

const reservationSchema = z.object({
  productId: z.string().uuid(),
  qty: z.number().int().min(0).max(999),
  action: z.enum(["add", "set"]).optional(),
});

export async function POST(req: Request) {
  const token = extractCartToken(req);
  if (!token) {
    return NextResponse.json(
      { error: "Falta el identificador del carrito." },
      { status: 400 },
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud debe ser JSON válido." }, { status: 400 });
  }

  const parse = reservationSchema.safeParse(payload);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Datos inválidos para reservar stock." },
      { status: 400 },
    );
  }

  try {
    const result = await reserveCartItem(token, parse.data.productId, parse.data.qty, parse.data.action);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof CartReservationError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    const network = isNetworkActionError(error);
    console.error("cart/reservations POST error:", error);
    return NextResponse.json(
      {
        error: "No se pudo reservar el producto. Intenta nuevamente.",
        ...(network ? { code: "NETWORK" } : {}),
      },
      { status: network ? 503 : 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const token = extractCartToken(req);
  if (!token) {
    return NextResponse.json(
      { error: "Falta el identificador del carrito." },
      { status: 400 },
    );
  }

  try {
    await clearCartReservations(token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const network = isNetworkActionError(error);
    console.error("cart/reservations DELETE error:", error);
    return NextResponse.json(
      {
        error: "No se pudo limpiar las reservas del carrito.",
        ...(network ? { code: "NETWORK" } : {}),
      },
      { status: network ? 503 : 500 },
    );
  }
}
