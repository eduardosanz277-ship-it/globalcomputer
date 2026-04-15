import {
  ensureCartMeta,
  extendCartExpiration,
  getCartMeta,
  clearCartMeta,
} from "@/lib/cart-meta";
import {
  reserveCartItem as reserveCartItemSchema,
  releaseCartReservations,
} from "@/lib/cart-reservation";

export const GC_CART_STORAGE_KEY = "gc-store-cart";
export const GC_CART_OPEN_EVENT = "gc-cart-open";

export type GcCartItem = { productId: string; qty: number };

function readCartStorage(): GcCartItem[] {
  try {
    const raw = localStorage.getItem(GC_CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x): x is GcCartItem =>
          typeof x === "object" &&
          x !== null &&
          "productId" in x &&
          typeof (x as GcCartItem).productId === "string" &&
          "qty" in x &&
          typeof (x as GcCartItem).qty === "number",
      )
      .map((x) => ({
        productId: x.productId,
        qty: Math.max(1, Math.floor(Number(x.qty)) || 1),
      }));
  } catch {
    return [];
  }
}

function writeCartStorage(items: GcCartItem[]): void {
  localStorage.setItem(GC_CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("gc-cart-changed"));
}

function clearCartStorage(): void {
  localStorage.removeItem(GC_CART_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("gc-cart-changed"));
}

function ensureActiveCartMeta() {
  const meta = getCartMeta();
  if (meta && new Date(meta.expiresAt).getTime() <= Date.now()) {
    clearCartMeta();
    clearCartStorage();
    void releaseCartReservations(meta.token).catch(() => undefined);
  }
  return ensureCartMeta();
}

export function gcCartRead(): GcCartItem[] {
  if (typeof window === "undefined") return [];
  const meta = getCartMeta();
  if (meta && new Date(meta.expiresAt).getTime() <= Date.now()) {
    clearCartMeta();
    clearCartStorage();
    void releaseCartReservations(meta.token).catch(() => undefined);
    return [];
  }
  return readCartStorage();
}

function updateLocalLine(productId: string, qty: number): void {
  const items = readCartStorage();
  const index = items.findIndex((x) => x.productId === productId);
  if (qty <= 0) {
    if (index >= 0) {
      items.splice(index, 1);
      writeCartStorage(items);
    }
    return;
  }
  if (index >= 0) {
    items[index] = { productId, qty };
  } else {
    items.push({ productId, qty });
  }
  writeCartStorage(items);
}

export async function gcCartAddProduct(productId: string, qty = 1): Promise<void> {
  if (typeof window === "undefined") return;
  const meta = ensureActiveCartMeta();
  const response = await reserveCartItemSchema(meta.token, productId, qty, "add");
  updateLocalLine(productId, response.qty);
  extendCartExpiration(meta.token);
}

export async function gcCartRemoveProduct(productId: string): Promise<void> {
  if (typeof window === "undefined") return;
  const meta = ensureActiveCartMeta();
  await reserveCartItemSchema(meta.token, productId, 0, "set");
  updateLocalLine(productId, 0);
  extendCartExpiration(meta.token);
}

export async function gcCartSetQty(
  productId: string,
  qty: number,
  maxQty?: number,
): Promise<void> {
  if (typeof window === "undefined") return;
  const meta = ensureActiveCartMeta();
  const normalizedQty = Math.max(0, Math.floor(qty) || 0);
  const capped =
    maxQty != null && Number.isFinite(maxQty)
      ? Math.min(normalizedQty, Math.max(0, Math.floor(maxQty)))
      : normalizedQty;
  await reserveCartItemSchema(meta.token, productId, capped, "set");
  updateLocalLine(productId, capped);
  extendCartExpiration(meta.token);
}

export async function gcCartClear(): Promise<void> {
  if (typeof window === "undefined") return;
  const meta = getCartMeta();
  clearCartMeta();
  clearCartStorage();
  if (meta?.token) {
    await releaseCartReservations(meta.token).catch(() => undefined);
  }
}

export function gcCartTotalUnits(items: GcCartItem[]): number {
  return items.reduce((sum, x) => sum + x.qty, 0);
}
