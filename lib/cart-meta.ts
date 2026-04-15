const CART_META_KEY = "gc-store-cart-meta";
const CART_EXPIRATION_MINUTES = 30;

export type CartMeta = {
  token: string;
  expiresAt: string;
};

function generateCartToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function nextExpiration() {
  return new Date(Date.now() + CART_EXPIRATION_MINUTES * 60 * 1000).toISOString();
}

export function getCartMeta(): CartMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CART_META_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CartMeta;
    if (!parsed.token || !parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setCartMeta(meta: CartMeta): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_META_KEY, JSON.stringify(meta));
}

export function clearCartMeta(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_META_KEY);
}

export function ensureCartMeta(): CartMeta {
  const existing = getCartMeta();
  if (existing && new Date(existing.expiresAt).getTime() > Date.now()) {
    const refreshed = { token: existing.token, expiresAt: nextExpiration() };
    setCartMeta(refreshed);
    return refreshed;
  }
  clearCartMeta();
  const token = generateCartToken();
  const meta = { token, expiresAt: nextExpiration() };
  setCartMeta(meta);
  return meta;
}

export function extendCartExpiration(token: string): CartMeta {
  const meta = { token, expiresAt: nextExpiration() };
  setCartMeta(meta);
  return meta;
}
