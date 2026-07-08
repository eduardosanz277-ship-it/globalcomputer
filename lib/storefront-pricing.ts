import type { UserRole } from "@/modules/auth/auth.types";

export type StorefrontPriceTier = "client" | "business";

export type StorefrontPricingProduct = {
  price_client: number;
  price_business: number;
  discount_client_pct: number;
  discount_business_pct: number;
};

/** Invitado y cliente (y admin en vitrina) → precio cliente; empresa → precio empresa. */
export function resolveStorefrontPriceTier(
  role: UserRole | null | undefined,
): StorefrontPriceTier {
  if (role === "BUSINESS") return "business";
  return "client";
}

export function resolveStorefrontBasePrice(
  product: StorefrontPricingProduct,
  tier: StorefrontPriceTier,
): number {
  const raw =
    tier === "business" ? product.price_business : product.price_client;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function activeDiscountPercent(
  product: StorefrontPricingProduct,
  tier: StorefrontPriceTier,
): number {
  const raw =
    tier === "business"
      ? product.discount_business_pct
      : product.discount_client_pct;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(100, n);
}

export function priceAfterDiscount(
  basePrice: number,
  discountPct: number,
): number {
  if (discountPct <= 0) return basePrice;
  const v = basePrice * (1 - discountPct / 100);
  return Math.round(v * 100) / 100;
}

export function resolveStorefrontUnitPrice(
  product: StorefrontPricingProduct,
  tier: StorefrontPriceTier,
): number {
  return priceAfterDiscount(
    resolveStorefrontBasePrice(product, tier),
    activeDiscountPercent(product, tier),
  );
}
