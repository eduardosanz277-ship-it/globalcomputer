import type { PublicSiteOffer } from "@/lib/site-offer.types";

/** Importe USD con dos decimales consistentes con cobro/visualización. */
export function roundUsd(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100) / 100;
}

/**
 * Descuento global desde app_config: si el subtotal alcanza `offerAmount`,
 * se aplica `offerPercentage` sobre el subtotal (después de precios de tienda/perfil).
 */
export function computeSiteOfferOnSubtotal(
  subtotalUsd: number,
  offer: Pick<PublicSiteOffer, "offerAmount" | "offerPercentage">,
): {
  applies: boolean;
  discountUsd: number;
  totalAfterDiscountUsd: number;
  /** Factor uniforme por línea para repartir el descuento sin sesgo (Stripe line_items). */
  unitPriceFactor: number;
} {
  const pct = offer.offerPercentage;
  const threshold = offer.offerAmount;

  if (
    !Number.isFinite(subtotalUsd) ||
    subtotalUsd <= 0 ||
    !(pct > 0) ||
    !Number.isFinite(threshold) ||
    subtotalUsd < threshold
  ) {
    return {
      applies: false,
      discountUsd: 0,
      totalAfterDiscountUsd: roundUsd(subtotalUsd),
      unitPriceFactor: 1,
    };
  }

  const discountUsd = roundUsd(subtotalUsd * (pct / 100));
  const totalAfterDiscountUsd = roundUsd(Math.max(0, subtotalUsd - discountUsd));
  const unitPriceFactor =
    subtotalUsd > 0 ? totalAfterDiscountUsd / subtotalUsd : 1;

  return {
    applies: true,
    discountUsd,
    totalAfterDiscountUsd,
    unitPriceFactor,
  };
}
