/**
 * Modelo y utilidades puras del producto en vitrina (sin Supabase).
 * Importable desde Client Components.
 */

/** Días desde `created_at` para mostrar badge "Nuevo" en tarjetas. */
export const STOREFRONT_PRODUCT_NEW_DAYS = 5;

export type StorefrontProduct = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  price: number;
  stock: number;
  discount_business_pct: number;
  discount_client: number;
  brand_id: string;
  brand_type_id: string | null;
  brand_name: string;
  /** Categoría efectiva en catálogo (directa o padre de la subcategoría); null si no está clasificado. */
  category_id: string | null;
  category_name: string | null;
  /**
   * Características específicas asignadas al producto (una entrada por específico),
   * con referencia a su categoría general para filtros agrupados.
   */
  characteristic_specifics: {
    id: string;
    name: string;
    general_id: string;
    general_name: string;
  }[];
  product_images: {
    id: string;
    url: string;
    is_primary: boolean;
    sort_order: number;
  }[];
};

export function storefrontPrimaryImageUrl(
  product: StorefrontProduct,
): string | null {
  const imgs = product.product_images.slice().sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
  const primary = imgs.find((i) => i.is_primary) ?? imgs[0];
  return primary?.url ?? null;
}

/** Fecha de creación dentro de los últimos `days` días (ISO u otro formato parseable por `Date`). */
export function isNewFromCreatedAt(
  createdAt: string | undefined | null,
  days: number = STOREFRONT_PRODUCT_NEW_DAYS,
): boolean {
  const raw = createdAt?.trim();
  if (!raw) return false;
  const created = Date.parse(raw);
  if (Number.isNaN(created)) return false;
  const limitMs = days * 24 * 60 * 60 * 1000;
  return Date.now() - created <= limitMs;
}

/** Producto creado hace menos de {@link STOREFRONT_PRODUCT_NEW_DAYS} días (según `created_at`). */
export function isStorefrontProductNew(
  product: StorefrontProduct,
  days: number = STOREFRONT_PRODUCT_NEW_DAYS,
): boolean {
  return isNewFromCreatedAt(product.created_at, days);
}
