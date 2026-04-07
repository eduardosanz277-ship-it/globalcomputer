/**
 * Modelo y utilidades puras del producto en vitrina (sin Supabase).
 * Importable desde Client Components.
 */

export type StorefrontProduct = {
  id: string;
  name: string;
  updated_at: string;
  price: number;
  stock: number;
  discount_business_pct: number;
  discount_client: number;
  brand_id: string;
  brand_type_id: string | null;
  brand_name: string;
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
