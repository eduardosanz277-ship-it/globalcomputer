import {
  resolveStorefrontUnitPrice,
  type StorefrontPriceTier,
} from "@/lib/storefront-pricing";
import type { StorefrontProduct } from "@/modules/catalog/storefront-product.shared";
import type { GcCartItem } from "@/lib/store-cart";

export function cartLineUnitPrice(
  product: StorefrontProduct,
  tier: StorefrontPriceTier,
): number {
  return resolveStorefrontUnitPrice(product, tier);
}

export function computeCartSubtotal(
  items: GcCartItem[],
  productsById: Record<string, StorefrontProduct>,
  tier: StorefrontPriceTier,
): number {
  return items.reduce((sum, line) => {
    const p = productsById[line.productId];
    if (!p) return sum;
    return sum + cartLineUnitPrice(p, tier) * line.qty;
  }, 0);
}
