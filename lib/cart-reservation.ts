const CART_RESERVATIONS_ROUTE = "/api/cart/reservations";
const HEADER_CART_TOKEN = "x-gc-cart-token";

export class CartReservationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CartReservationError";
  }
}

export type CartReservationResponse = {
  qty: number;
  expiresAt: string;
  availableAfter: number;
};

async function fetchWithCartToken(
  token: string,
  input: string,
  init: RequestInit,
): Promise<Response> {
  const headers = new Headers(init.headers ?? {});
  headers.set("Content-Type", "application/json");
  headers.set(HEADER_CART_TOKEN, token);
  return fetch(`${CART_RESERVATIONS_ROUTE}${input}`, {
    ...init,
    headers,
  });
}

async function handleResponse(response: Response): Promise<any> {
  if (response.ok) {
    return response.json().catch(() => ({}));
  }
  const payload = await response.json().catch(() => null);
  throw new CartReservationError(
    payload?.error ?? "No se pudo reservar el producto. Intenta nuevamente.",
  );
}

export function reserveCartItem(
  token: string,
  productId: string,
  qty: number,
  action: "add" | "set" = "add",
): Promise<CartReservationResponse> {
  return fetchWithCartToken(token, "", {
    method: "POST",
    body: JSON.stringify({ productId, qty, action }),
  }).then(handleResponse);
}

export function releaseCartReservations(token: string): Promise<void> {
  return fetchWithCartToken(token, "", { method: "DELETE" }).then((response) => {
    if (!response.ok) {
      throw new CartReservationError("No se pudo limpiar el carrito.");
    }
  });
}
