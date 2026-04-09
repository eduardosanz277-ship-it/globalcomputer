export const GC_CART_STORAGE_KEY = "gc-store-cart";

/** Se emite al añadir productos al carrito (p. ej. abrir el panel lateral). */
export const GC_CART_OPEN_EVENT = "gc-cart-open";

export type GcCartItem = { productId: string; qty: number };

export function gcCartRead(): GcCartItem[] {
  if (typeof window === "undefined") return [];
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

function gcCartWrite(items: GcCartItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GC_CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("gc-cart-changed"));
}

export function gcCartAddProduct(productId: string, qty = 1): void {
  if (typeof window === "undefined") return;
  const items = gcCartRead();
  const i = items.findIndex((x) => x.productId === productId);
  const add = Math.max(1, Math.floor(qty) || 1);
  if (i >= 0) {
    items[i] = { ...items[i], qty: items[i].qty + add };
    const [row] = items.splice(i, 1);
    items.push(row);
  } else {
    items.push({ productId, qty: add });
  }
  gcCartWrite(items);
  window.dispatchEvent(new CustomEvent(GC_CART_OPEN_EVENT));
}

export function gcCartRemoveProduct(productId: string): void {
  if (typeof window === "undefined") return;
  gcCartWrite(gcCartRead().filter((x) => x.productId !== productId));
}

/**
 * `qty` 0 elimina la línea. Respeta stock máximo si se pasa `maxQty`.
 */
export function gcCartSetQty(
  productId: string,
  qty: number,
  maxQty?: number,
): void {
  if (typeof window === "undefined") return;
  const q = Math.max(0, Math.floor(qty) || 0);
  const capped =
    maxQty != null && Number.isFinite(maxQty)
      ? Math.min(q, Math.max(0, Math.floor(maxQty)))
      : q;
  const items = gcCartRead();
  const i = items.findIndex((x) => x.productId === productId);
  if (i < 0) return;
  if (capped <= 0) {
    items.splice(i, 1);
  } else {
    items[i] = { ...items[i], qty: capped };
  }
  gcCartWrite(items);
}

export function gcCartClear(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GC_CART_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("gc-cart-changed"));
}

export function gcCartTotalUnits(items: GcCartItem[]): number {
  return items.reduce((sum, x) => sum + x.qty, 0);
}
