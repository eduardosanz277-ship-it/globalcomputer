export type PricingStrategy =
  | "cost"
  | "client_price"
  | "business_price"
  | "manual";

export type PricingInputs = {
  cost: number;
  marginClientPct: number;
  marginBusinessPct: number;
  priceClient: number;
  priceBusiness: number;
};

export type ComputedPrices = {
  priceClient: number;
  priceBusiness: number;
};

function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

/** Calcula precios base según la estrategia (sin descuentos). */
export function computePricesForStrategy(
  strategy: PricingStrategy,
  inputs: PricingInputs,
): ComputedPrices {
  const cost = Math.max(0, inputs.cost);
  const marginClientPct = clampPercent(inputs.marginClientPct);
  const marginBusinessPct = clampPercent(inputs.marginBusinessPct);

  if (strategy === "cost") {
    return {
      priceClient: roundMoney(cost + (cost * marginClientPct) / 100),
      priceBusiness: roundMoney(cost + (cost * marginBusinessPct) / 100),
    };
  }

  if (strategy === "client_price") {
    const priceClient = Math.max(0, inputs.priceClient);
    return {
      priceClient: roundMoney(priceClient),
      priceBusiness: roundMoney(priceClient * (1 - marginBusinessPct / 100)),
    };
  }

  if (strategy === "business_price") {
    const priceBusiness = Math.max(0, inputs.priceBusiness);
    return {
      priceClient: roundMoney(priceBusiness * (1 + marginClientPct / 100)),
      priceBusiness: roundMoney(priceBusiness),
    };
  }

  return {
    priceClient: roundMoney(Math.max(0, inputs.priceClient)),
    priceBusiness: roundMoney(Math.max(0, inputs.priceBusiness)),
  };
}

export function previewPriceAfterDiscount(
  basePrice: number,
  discountPct: number,
): number {
  const pct = clampPercent(discountPct);
  if (pct <= 0) return roundMoney(basePrice);
  return roundMoney(basePrice * (1 - pct / 100));
}
