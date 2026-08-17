/**
 * Navegación de listado → ficha de producto (`?from=`).
 * Solo rutas de catálogo/listado; no el detalle de otro producto.
 */

const PRODUCT_DETAIL_SLUG_RE =
  /^\/products\/(?!featured$)[^/]+\/?$/;

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

export function buildStorefrontProductHref(
  slug: string,
  fromPathname?: string | null,
): string {
  const base = `/products/${encodeURIComponent(slug)}`;
  const from = normalizeStorefrontFromPath(fromPathname);
  if (!from || !isStorefrontListingPath(from)) return base;
  if (PRODUCT_DETAIL_SLUG_RE.test(from)) return base;
  return `${base}?from=${encodeURIComponent(from)}`;
}
