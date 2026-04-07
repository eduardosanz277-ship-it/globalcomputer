import type { UserRole } from "@/modules/auth/auth.types";

export type StorefrontPriceTier = "client" | "business";

/** Invitado y cliente (y admin en vitrina) → precio cliente; empresa → precio empresa. */
export function resolveStorefrontPriceTier(
  role: UserRole | null | undefined,
): StorefrontPriceTier {
  if (role === "BUSINESS") return "business";
  return "client";
}

export function activeDiscountPercent(
  product: {
    discount_client: number;
    discount_business_pct: number;
  },
  tier: StorefrontPriceTier,
): number {
  const raw =
    tier === "business"
      ? product.discount_business_pct
      : product.discount_client;
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
