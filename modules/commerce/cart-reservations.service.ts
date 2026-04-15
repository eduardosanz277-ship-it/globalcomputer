import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const CART_RESERVATION_MINUTES = 30;
const CART_RESERVATION_TTL_MS = CART_RESERVATION_MINUTES * 60 * 1000;

export class CartReservationError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = "CartReservationError";
  }
}

export type CartReservationResult = {
  qty: number;
  expiresAt: string;
  availableAfter: number;
};

const MAX_CART_LINE_QTY = 999;

function reservationExpiresAt(): string {
  return new Date(Date.now() + CART_RESERVATION_TTL_MS).toISOString();
}

async function currentActiveReservationQty(productId: string): Promise<number> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("cart_reservation_active_quantity", {
    product_id: productId,
  });
  if (error) throw error;
  if (data == null) return 0;
  if (Array.isArray(data)) {
    const row = data[0];
    return Number(row?.cart_reservation_active_quantity ?? 0);
  }
  if (typeof data === "number") {
    return data;
  }
  return Number((data as { cart_reservation_active_quantity?: unknown })?.cart_reservation_active_quantity ?? 0);
}

export async function reserveCartItem(
  cartToken: string,
  productId: string,
  qty: number,
  action: "add" | "set" = "add",
): Promise<CartReservationResult> {
  const desiredQty = Math.max(0, Math.floor(qty) || 0);
  if (desiredQty > MAX_CART_LINE_QTY) {
    throw new CartReservationError(`Cantidad máxima permitida: ${MAX_CART_LINE_QTY}.`);
  }

  const supabase = createSupabaseAdminClient();

  const [productResult, existingResult] = await Promise.all([
    supabase.from("products").select("id, stock").eq("id", productId).maybeSingle(),
    supabase
      .from("cart_reservations")
      .select("qty")
      .eq("cart_token", cartToken)
      .eq("product_id", productId)
      .maybeSingle(),
  ]);

  if (productResult.error) throw productResult.error;
  const product = productResult.data;
  if (!product?.id) {
    throw new CartReservationError("Producto no encontrado.", 404);
  }

  const existingQty = Number(existingResult.data?.qty ?? 0);
  const targetQty = action === "set" ? desiredQty : existingQty + desiredQty;
  if (targetQty > MAX_CART_LINE_QTY) {
    throw new CartReservationError(`Cantidad máxima permitida: ${MAX_CART_LINE_QTY}.`);
  }

  const reservedActiveQty = await currentActiveReservationQty(productId);
  const reservedOther = Math.max(0, reservedActiveQty - existingQty);
  const availableForCart = Math.max(0, Number(product.stock ?? 0) - reservedOther);
  if (targetQty > availableForCart) {
    throw new CartReservationError(
      "No hay stock suficiente para esa cantidad. Actualiza el carrito con una cantidad menor.",
    );
  }

  const expiresAt = reservationExpiresAt();

  if (targetQty <= 0) {
    if (existingQty > 0) {
      await supabase
        .from("cart_reservations")
        .delete()
        .eq("cart_token", cartToken)
        .eq("product_id", productId);
    }
    return {
      qty: 0,
      expiresAt,
      availableAfter: availableForCart,
    };
  }

  const { error: upsertError } = await supabase
    .from("cart_reservations")
    .upsert(
      {
        cart_token: cartToken,
        product_id: productId,
        qty: targetQty,
        expires_at: expiresAt,
      },
      { onConflict: "cart_token,product_id" },
    );
  if (upsertError) throw upsertError;

  return {
    qty: targetQty,
    expiresAt,
    availableAfter: Math.max(0, Number(product.stock ?? 0) - (reservedOther + targetQty)),
  };
}

export async function clearCartReservations(cartToken: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase.from("cart_reservations").delete().eq("cart_token", cartToken);
}
