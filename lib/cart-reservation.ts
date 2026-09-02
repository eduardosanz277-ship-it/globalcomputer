import { isNetworkActionError } from "@/lib/errors/network-action-error";

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

function createNetworkError(): TypeError {
  return new TypeError("Failed to fetch");
}

function assertBrowserOnline(): void {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw createNetworkError();
  }
}

async function fetchWithCartToken(
  token: string,
  input: string,
  init: RequestInit,
): Promise<Response> {
  assertBrowserOnline();
  const headers = new Headers(init.headers ?? {});
  headers.set("Content-Type", "application/json");
  headers.set(HEADER_CART_TOKEN, token);
  try {
    return await fetch(`${CART_RESERVATIONS_ROUTE}${input}`, {
      ...init,
      headers,
    });
  } catch (error) {
    if (isNetworkActionError(error)) throw createNetworkError();
    throw error;
  }
}

async function handleResponse(response: Response): Promise<any> {
  if (response.ok) {
    return response.json().catch(() => ({}));
  }
  const payload = (await response.json().catch(() => null)) as {
    error?: string;
    code?: string;
  } | null;
  if (response.status === 503 || payload?.code === "NETWORK") {
    throw createNetworkError();
  }
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
  return fetchWithCartToken(token, "", { method: "DELETE" }).then(
    async (response) => {
      if (response.ok) return;
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        code?: string;
      } | null;
      if (response.status === 503 || payload?.code === "NETWORK") {
        throw createNetworkError();
      }
      throw new CartReservationError("No se pudo limpiar el carrito.");
    },
  );
}
