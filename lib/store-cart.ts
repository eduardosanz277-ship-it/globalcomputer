export const GC_CART_STORAGE_KEY = "gc-store-cart";

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

export function gcCartAddProduct(productId: string, qty = 1): void {
  if (typeof window === "undefined") return;
  const items = gcCartRead();
  const i = items.findIndex((x) => x.productId === productId);
  const add = Math.max(1, Math.floor(qty) || 1);
  if (i >= 0) {
    items[i] = { ...items[i], qty: items[i].qty + add };
  } else {
    items.push({ productId, qty: add });
  }
  localStorage.setItem(GC_CART_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("gc-cart-changed"));
}
