import type {
  ShippingFreeSurchargeBehavior,
  ShippingOverLimitAction,
  ShippingQuote,
  ShippingQuoteLineInput,
  ShippingRate,
  ShippingSettings,
} from "./shipping.types";

export function buildWhatsAppUrl(phone: string, message: string): string | null {
  const national = phone.replace(/\D/g, "");
  if (!national) return null;
  /** Código de país EE.UU./PR (+1): se antepone si el número guardado no lo trae. */
  const digits = national.startsWith("1") ? national : `1${national}`;
  const text = message.trim();
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${q}`;
}

export function shouldRedirectToWhatsApp(
  subtotal: number,
  autoCalcMaxSubtotal: number,
): boolean {
  return subtotal > autoCalcMaxSubtotal;
}

export function isFreeShipping(
  subtotal: number,
  enabled: boolean,
  minSubtotal: number,
): boolean {
  return enabled && subtotal >= minSubtotal;
}

/**
 * Busca la tarifa activa cuyo rango incluye `subtotal` (min <= subtotal <= max).
 * Las tarifas deben venir ya filtradas por `active` si aplica.
 */
export function findShippingRate(
  subtotal: number,
  rates: ShippingRate[],
): ShippingRate | null {
  if (!Number.isFinite(subtotal) || subtotal < 0) return null;
  const sorted = rates
    .slice()
    .sort((a, b) => a.minAmount - b.minAmount || a.sortOrder - b.sortOrder);
  return (
    sorted.find(
      (r) => subtotal >= r.minAmount && subtotal <= r.maxAmount,
    ) ?? null
  );
}

export function calculateShippingSurcharge(
  lines: ShippingQuoteLineInput[],
): {
  surchargesTotal: number;
  surchargeLines: ShippingQuote["surchargeLines"];
} {
  const surchargeLines: ShippingQuote["surchargeLines"] = [];
  let surchargesTotal = 0;

  for (const line of lines) {
    const qty = Math.max(0, Math.floor(line.quantity));
    if (qty <= 0) continue;
    if (line.shippingType !== "non_standard") continue;
    const unit = Math.max(0, Number(line.shippingSurchargePerUnit) || 0);
    if (unit <= 0) continue;
    const lineSurcharge = unit * qty;
    surchargesTotal += lineSurcharge;
    surchargeLines.push({
      productId: line.productId,
      quantity: qty,
      unitSurcharge: unit,
      lineSurcharge,
    });
  }

  return {
    surchargesTotal: roundMoney(surchargesTotal),
    surchargeLines,
  };
}

function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export type CalculateShippingInput = {
  subtotal: number;
  lines: ShippingQuoteLineInput[];
  settings: Pick<
    ShippingSettings,
    | "autoCalcMaxSubtotal"
    | "overLimitAction"
    | "whatsappPhone"
    | "whatsappMessage"
    | "freeShippingEnabled"
    | "freeShippingMinSubtotal"
    | "freeShippingSurchargeBehavior"
  >;
  rates: ShippingRate[];
};

/**
 * Motor de cotización de envío (sin peso/dimensiones).
 * Usa subtotal de mercancía y tarifas por rango + recargos no estándar.
 */
export function calculateShipping(input: CalculateShippingInput): ShippingQuote {
  const subtotal = Number(input.subtotal);
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return emptyQuote("invalid", "shipping.quote.invalidSubtotal");
  }

  const {
    autoCalcMaxSubtotal,
    overLimitAction,
    whatsappPhone,
    whatsappMessage,
    freeShippingEnabled,
    freeShippingMinSubtotal,
    freeShippingSurchargeBehavior,
  } = input.settings;

  if (shouldRedirectToWhatsApp(subtotal, autoCalcMaxSubtotal)) {
    const action: ShippingOverLimitAction = overLimitAction;
    const whatsappUrl =
      action === "whatsapp"
        ? buildWhatsAppUrl(whatsappPhone, whatsappMessage)
        : null;
    return {
      status: "requires_quote",
      subtotal: roundMoney(subtotal),
      baseRate: 0,
      surchargesTotal: 0,
      shippingTotal: 0,
      freeShippingApplied: false,
      requiresQuote: true,
      overLimitAction: action,
      whatsappUrl,
      matchedRateId: null,
      surchargeLines: [],
      messageKey: "shipping.quote.requiresQuote",
    };
  }

  const free = isFreeShipping(
    subtotal,
    freeShippingEnabled,
    freeShippingMinSubtotal,
  );

  const matched = findShippingRate(subtotal, input.rates);
  if (!free && !matched) {
    return {
      ...emptyQuote("no_rate", "shipping.quote.noRate"),
      subtotal: roundMoney(subtotal),
    };
  }

  const baseRate = free ? 0 : (matched?.cost ?? 0);
  const { surchargesTotal, surchargeLines } = calculateShippingSurcharge(
    input.lines,
  );

  const effectiveSurcharges = applyFreeShippingSurchargeBehavior(
    surchargesTotal,
    surchargeLines,
    free,
    freeShippingSurchargeBehavior,
  );

  const shippingTotal = roundMoney(baseRate + effectiveSurcharges.total);

  return {
    status: "ok",
    subtotal: roundMoney(subtotal),
    baseRate: roundMoney(baseRate),
    surchargesTotal: effectiveSurcharges.total,
    shippingTotal,
    freeShippingApplied: free,
    requiresQuote: false,
    overLimitAction: null,
    whatsappUrl: null,
    matchedRateId: matched?.id ?? null,
    surchargeLines: effectiveSurcharges.lines,
    messageKey: free ? "shipping.quote.freeShippingApplied" : null,
  };
}

function applyFreeShippingSurchargeBehavior(
  surchargesTotal: number,
  surchargeLines: ShippingQuote["surchargeLines"],
  free: boolean,
  behavior: ShippingFreeSurchargeBehavior,
): { total: number; lines: ShippingQuote["surchargeLines"] } {
  if (!free) {
    return { total: surchargesTotal, lines: surchargeLines };
  }
  if (behavior === "waive_surcharges") {
    return { total: 0, lines: [] };
  }
  return { total: surchargesTotal, lines: surchargeLines };
}

function emptyQuote(
  status: ShippingQuote["status"],
  messageKey: string,
): ShippingQuote {
  return {
    status,
    subtotal: 0,
    baseRate: 0,
    surchargesTotal: 0,
    shippingTotal: 0,
    freeShippingApplied: false,
    requiresQuote: status === "requires_quote",
    overLimitAction: null,
    whatsappUrl: null,
    matchedRateId: null,
    surchargeLines: [],
    messageKey,
  };
}

/** Detecta solapamiento entre un rango candidato y tarifas existentes. */
export function rangesOverlap(
  aMin: number,
  aMax: number,
  bMin: number,
  bMax: number,
): boolean {
  return aMin <= bMax && bMin <= aMax;
}

export function findOverlappingRate(
  candidate: { minAmount: number; maxAmount: number },
  rates: ShippingRate[],
  excludeId?: string,
): ShippingRate | null {
  return (
    rates.find((r) => {
      if (excludeId && r.id === excludeId) return false;
      return rangesOverlap(
        candidate.minAmount,
        candidate.maxAmount,
        r.minAmount,
        r.maxAmount,
      );
    }) ?? null
  );
}
