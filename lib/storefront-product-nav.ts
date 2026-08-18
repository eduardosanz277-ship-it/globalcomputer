/**
 * Navegación listado ↔ ficha y ficha ↔ ficha (`?from=` + pila en sessionStorage).
 */

const PRODUCT_DETAIL_SLUG_RE =
  /^\/products\/(?!featured$)[^/]+\/?$/;

const PRODUCT_NAV_STACK_KEY = "gc:storefront-product-nav";

/** Listado general de catálogo (fallback de “Volver” sin historial interno). */
export const STOREFRONT_CATALOG_PATH = "/products";

export function normalizeStorefrontFromPath(
  raw: string | null | undefined,
): string | null {
  if (!raw || typeof raw !== "string") return null;
  let path = raw.trim();
  if (!path) return null;
  try {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      path = new URL(path).pathname;
    }
  } catch {
    return null;
  }
  const q = path.indexOf("?");
  if (q >= 0) path = path.slice(0, q);
  const h = path.indexOf("#");
  if (h >= 0) path = path.slice(0, h);
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path || null;
}

/** ¿La ruta es un listado desde el que tiene sentido preservar migas? */
export function isStorefrontListingPath(pathname: string): boolean {
  const path = normalizeStorefrontFromPath(pathname);
  if (!path) return false;
  if (path === "/products" || path === "/products/featured") return true;
  if (path.startsWith("/catalog/")) return true;
  if (path.startsWith("/brands/") && path !== "/brands") return true;
  if (path === "/security-system" || path.startsWith("/security-system/")) {
    return true;
  }
  return false;
}

export function isStorefrontProductDetailPath(pathname: string): boolean {
  const path = normalizeStorefrontFromPath(pathname);
  return Boolean(path && PRODUCT_DETAIL_SLUG_RE.test(path));
}

export function isStorefrontBackTargetPath(pathname: string): boolean {
  return (
    isStorefrontListingPath(pathname) || isStorefrontProductDetailPath(pathname)
  );
}

function readProductNavStack(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(PRODUCT_NAV_STACK_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function writeProductNavStack(stack: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      PRODUCT_NAV_STACK_KEY,
      JSON.stringify(stack.slice(-20)),
    );
  } catch {
    /* storage lleno o bloqueado */
  }
}

export function currentStorefrontLocationHref(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.pathname}${window.location.search}`;
}

/**
 * Registra la ficha actual.
 * Si se llega desde un listado (menú / catálogo), se reinicia la pila:
 * no se mezcla con un producto de otra navegación.
 */
export function recordStorefrontProductVisit(fromPath?: string | null): void {
  if (typeof window === "undefined") return;
  const path = currentStorefrontLocationHref();
  if (!path.startsWith("/")) return;
  const pathname = normalizeStorefrontFromPath(path);
  if (!pathname || !isStorefrontProductDetailPath(pathname)) return;

  const from = normalizeStorefrontFromPath(fromPath);
  const continuesProductChain = Boolean(
    from && isStorefrontProductDetailPath(from),
  );
  if (!continuesProductChain) {
    writeProductNavStack([path]);
    return;
  }

  const stack = readProductNavStack();
  if (stack[stack.length - 1] === path) return;
  stack.push(path);
  writeProductNavStack(stack);
}

/**
 * Quita la ficha actual y devuelve la anterior (producto o listado con query).
 */
export function consumeStorefrontProductBackHref(): string | null {
  if (typeof window === "undefined") return null;
  const stack = readProductNavStack();
  if (stack.length < 2) return null;
  stack.pop();
  const previous = stack[stack.length - 1] ?? null;
  writeProductNavStack(stack);
  return previous;
}

export function resetStorefrontProductNavStack(): void {
  writeProductNavStack([]);
}

export function scrollStorefrontToPageTop(): void {
  if (typeof window === "undefined") return;
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

/**
 * Hay una entrada previa en el historial de Next.js (navegación interna).
 * `idx === 0` incluye aterrizaje desde Google u otra pestaña: `back()` saldría del sitio.
 */
export function canGoBackInternally(): boolean {
  if (typeof window === "undefined") return false;
  const idx = window.history.state?.idx;
  if (typeof idx === "number") return idx > 0;

  try {
    const referrer = document.referrer;
    if (!referrer) return false;
    const url = new URL(referrer);
    if (url.origin !== window.location.origin) return false;
    return window.history.length > 1;
  } catch {
    return false;
  }
}

/**
 * `?from=` solo se conserva al abrir un producto desde un listado o
 * desde otra ficha. Una búsqueda (`?q=`) no es la ubicación del producto.
 */
export function storefrontProductFromPath(
  pathname?: string | null,
  searchQuery?: string | null,
): string | null {
  if (typeof searchQuery === "string" && searchQuery.trim()) return null;
  const from = normalizeStorefrontFromPath(pathname);
  if (!from) return null;
  if (isStorefrontListingPath(from) || isStorefrontProductDetailPath(from)) {
    return from;
  }
  return null;
}

export function buildStorefrontProductHref(
  slug: string,
  fromPathname?: string | null,
  searchQuery?: string | null,
): string {
  const base = `/products/${encodeURIComponent(slug)}`;
  const from = storefrontProductFromPath(fromPathname, searchQuery);
  if (!from) return base;
  const fromBase = from.split("?")[0] ?? from;
  if (fromBase === base) return base;
  return `${base}?from=${encodeURIComponent(from)}`;
}
