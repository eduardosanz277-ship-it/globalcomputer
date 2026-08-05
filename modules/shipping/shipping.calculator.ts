import { computeSiteOfferOnSubtotal } from "@/lib/site-offer-discount";
import type {
  ShippingFreeSurchargeBehavior,
  ShippingOverLimitAction,
  ShippingQuote,
  ShippingQuoteLineInput,
  ShippingQuoteLocale,
  ShippingQuoteOfferInput,
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

function formatUsdPlain(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatOfferPercentage(value: number): string {
  return Number.isInteger(value)
    ? value.toString()
    : value.toFixed(2).replace(/\.?0+$/, "");
}

const WHATSAPP_QUOTE_COPY: Record<
  ShippingQuoteLocale,
  {
    orderDetails: string;
    summary: string;
    subtotal: string;
    discount: (pct: string) => string;
    orderTotal: string;
    shippingPending: string;
    closing: string;
  }
> = {
  es: {
    orderDetails: "Detalle del pedido",
    summary: "Resumen",
    subtotal: "Subtotal",
    discount: (pct) => `Descuento (${pct}%)`,
    orderTotal: "Total del pedido",
    shippingPending: "Envío: Pendiente de cotización",
    closing: "Gracias. Quedo atento(a) a la cotización del envío.",
  },
  en: {
    orderDetails: "Order details",
    summary: "Summary",
    subtotal: "Subtotal",
    discount: (pct) => `Discount (${pct}%)`,
    orderTotal: "Order total",
    shippingPending: "Shipping: Pending quote",
    closing: "Thank you. I look forward to receiving the shipping quote.",
  },
};

function resolveQuoteLocale(locale?: string | null): ShippingQuoteLocale {
  return locale === "en" ? "en" : "es";
}

/**
 * Mensaje WhatsApp: texto configurado en admin + desglose del pedido (según locale).
 */
export function buildWhatsAppQuoteMessage(
  configuredMessage: string,
  lines: ShippingQuoteLineInput[],
  subtotal: number,
  offer?: ShippingQuoteOfferInput | null,
  locale?: string | null,
): string {
  const lang = resolveQuoteLocale(locale);
  const copy = WHATSAPP_QUOTE_COPY[lang];
  const intro = configuredMessage.trim();
  const detailLines = lines.filter(
    (line) =>
      Math.max(0, Math.floor(line.quantity)) > 0 &&
      Boolean(line.productName?.trim()) &&
      Number.isFinite(line.unitPrice),
  );

  if (detailLines.length === 0) {
    return intro;
  }

  const offerResult = computeSiteOfferOnSubtotal(subtotal, {
    offerAmount: offer?.offerAmount ?? 0,
    offerPercentage: offer?.offerPercentage ?? 0,
  });

  const productBlock = detailLines
    .map((line) => {
      const qty = Math.max(0, Math.floor(line.quantity));
      const unit = Math.max(0, Number(line.unitPrice) || 0);
      const lineTotal = roundMoney(unit * qty);
      const name = line.productName!.trim();
      return `• ${name}\n${qty} × ${formatUsdPlain(unit)} = ${formatUsdPlain(lineTotal)}`;
    })
    .join("\n\n");

  const summaryLines: string[] = [
    `${copy.subtotal}: ${formatUsdPlain(roundMoney(subtotal))}`,
  ];
  if (offerResult.applies) {
    summaryLines.push(
      `${copy.discount(formatOfferPercentage(offer?.offerPercentage ?? 0))}: −${formatUsdPlain(offerResult.discountUsd)}`,
    );
  }
  summaryLines.push(
    `${copy.orderTotal}: ${formatUsdPlain(offerResult.totalAfterDiscountUsd)}`,
    copy.shippingPending,
  );

  const orderBlock = [
    "────────────────",
    copy.orderDetails,
    "",
    productBlock,
    "",
    "────────────────",
    copy.summary,
    "",
    ...summaryLines,
    "",
    copy.closing,
  ].join("\n");

  return intro ? `${intro}\n\n${orderBlock}` : orderBlock;
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
    | "whatsappMessageEn"
    | "freeShippingEnabled"
    | "freeShippingMinSubtotal"
    | "freeShippingSurchargeBehavior"
  >;
  rates: ShippingRate[];
  /** Oferta del sitio para el desglose del mensaje WhatsApp. */
  offer?: ShippingQuoteOfferInput | null;
  /** Locale del cliente para el mensaje WhatsApp. */
  locale?: string | null;
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
    whatsappMessageEn,
    freeShippingEnabled,
    freeShippingMinSubtotal,
    freeShippingSurchargeBehavior,
  } = input.settings;

  if (shouldRedirectToWhatsApp(subtotal, autoCalcMaxSubtotal)) {
    const action: ShippingOverLimitAction = overLimitAction;
    const lang = resolveQuoteLocale(input.locale);
    const intro =
      lang === "en"
        ? whatsappMessageEn.trim() || whatsappMessage
        : whatsappMessage;
    const message = buildWhatsAppQuoteMessage(
      intro,
      input.lines,
      subtotal,
      input.offer,
      lang,
    );
    const whatsappUrl =
      action === "whatsapp" ? buildWhatsAppUrl(whatsappPhone, message) : null;
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
