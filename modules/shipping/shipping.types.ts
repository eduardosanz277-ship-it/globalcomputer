/** Tipos del dominio de envíos (compartidos admin + storefront). */

export type ShippingOverLimitAction = "whatsapp";

export type ShippingFreeSurchargeBehavior =
  | "keep_surcharges"
  | "waive_surcharges";

export type ProductShippingType = "standard" | "non_standard";

export type ShippingSettings = {
  id: string;
  autoCalcMaxSubtotal: number;
  overLimitAction: ShippingOverLimitAction;
  whatsappPhone: string;
  whatsappMessage: string;
  freeShippingEnabled: boolean;
  freeShippingMinSubtotal: number;
  freeShippingSurchargeBehavior: ShippingFreeSurchargeBehavior;
  updatedAt: string;
};

export type ShippingRate = {
  id: string;
  minAmount: number;
  maxAmount: number;
  cost: number;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ShippingRateInput = {
  minAmount: number;
  maxAmount: number;
  cost: number;
  active: boolean;
  sortOrder: number;
};

export type ShippingSettingsInput = {
  autoCalcMaxSubtotal: number;
  overLimitAction: ShippingOverLimitAction;
  whatsappPhone: string;
  whatsappMessage: string;
  freeShippingEnabled: boolean;
  freeShippingMinSubtotal: number;
  freeShippingSurchargeBehavior: ShippingFreeSurchargeBehavior;
};

/** Línea de carrito mínima para cotizar envío. */
export type ShippingQuoteLineInput = {
  productId: string;
  quantity: number;
  shippingType: ProductShippingType;
  shippingSurchargePerUnit: number;
};

export type ShippingQuoteBreakdownLine = {
  productId: string;
  quantity: number;
  unitSurcharge: number;
  lineSurcharge: number;
};

export type ShippingQuoteStatus =
  | "ok"
  | "requires_quote"
  | "no_rate"
  | "invalid";

export type ShippingQuote = {
  status: ShippingQuoteStatus;
  subtotal: number;
  /** Tarifa de rango (0 si envío gratuito o requires_quote). */
  baseRate: number;
  /** Suma de recargos no estándar (puede ser 0). */
  surchargesTotal: number;
  /** baseRate + surchargesTotal (0 si requires_quote). */
  shippingTotal: number;
  freeShippingApplied: boolean;
  requiresQuote: boolean;
  overLimitAction: ShippingOverLimitAction | null;
  whatsappUrl: string | null;
  matchedRateId: string | null;
  surchargeLines: ShippingQuoteBreakdownLine[];
  messageKey: string | null;
};
