import { getAppBaseUrl } from "@/lib/app-url";
import { computeSiteOfferOnSubtotal } from "@/lib/site-offer-discount";
import { getPublicSiteOffer } from "@/lib/site-offer.server";
import type { GcCartItem } from "@/lib/store-cart";
import {
  resolveStorefrontPriceTier,
  resolveStorefrontUnitPrice,
} from "@/lib/storefront-pricing";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import type { SessionUser } from "@/modules/auth/auth.types";
import type { StorefrontProduct } from "@/modules/catalog/storefront-product.shared";
import { getStorefrontProductsByIds } from "@/modules/catalog/storefront-products.service";
import {
  repoGetDefaultShippingAddressForUser,
  repoGetProfileStripeCustomerId,
  repoSetProfileStripeCustomerId,
  type CheckoutShippingAddressRow,
} from "@/modules/commerce/checkout-address.repository";
import { countryToStripeIso2 } from "@/modules/commerce/country-to-stripe-iso";
import { quoteShippingService } from "@/modules/shipping/shipping.service";
import type { ShippingQuoteLineInput } from "@/modules/shipping/shipping.types";
import Stripe from "stripe";

export class CheckoutSessionError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = "CheckoutSessionError";
  }
}

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new CheckoutSessionError(
      "Pago no configurado (falta STRIPE_SECRET_KEY en el servidor).",
      503,
    );
  }
  return new Stripe(key, { typescript: true });
}

function unitPriceUsd(product: StorefrontProduct, tier: ReturnType<typeof resolveStorefrontPriceTier>): number {
  return resolveStorefrontUnitPrice(product, tier);
}

function dollarsToCents(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.round(amount * 100);
}

const MIN_CHECKOUT_USD = 0.5;

/**
 * Países desde los que Stripe Checkout permite pedir dirección de envío.
 * Override: `STRIPE_CHECKOUT_SHIPPING_COUNTRIES=ES,PT,FR,...` (códigos ISO-2 separados por coma).
 * @see https://stripe.com/docs/api/checkout/sessions/create#create_checkout_session-shipping_address_collection
 */
const DEFAULT_SHIPPING_COUNTRIES = [
  "ES",
  "AD",
  "PT",
  "FR",
  "DE",
  "IT",
  "GB",
  "IE",
  "NL",
  "BE",
  "AT",
  "CH",
  "US",
  "MX",
  "AR",
  "CO",
  "CL",
  "PE",
  "UY",
  "BR",
] as const;

type CheckoutSessionCreate = NonNullable<
  Parameters<Stripe["checkout"]["sessions"]["create"]>[0]
>;
type ShippingAllowedCountry = NonNullable<
  NonNullable<CheckoutSessionCreate["shipping_address_collection"]>["allowed_countries"]
>[number];

function shippingAllowedCountries(): ShippingAllowedCountry[] {
  const raw = process.env.STRIPE_CHECKOUT_SHIPPING_COUNTRIES?.trim();
  if (raw) {
    const list = raw
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter((c) => /^[A-Z]{2}$/.test(c));
    if (list.length > 0) {
      return list as ShippingAllowedCountry[];
    }
  }
  return [...DEFAULT_SHIPPING_COUNTRIES] as ShippingAllowedCountry[];
}

/**
 * Convierte una fila `addresses` al formato `shipping` de Stripe (prellenado en Checkout).
 * Si falta país mapeable o datos mínimos, devuelve null.
 */
function buildStripeShippingFromAddress(
  addr: CheckoutShippingAddressRow,
  fullNameFallback: string | undefined,
): Stripe.CustomerCreateParams.Shipping | null {
  const country = countryToStripeIso2(addr.country);
  if (!country) return null;
  const street = addr.street?.trim();
  const city = addr.city?.trim();
  if (!street || !city) return null;

  const name =
    [addr.first_name, addr.last_name].filter(Boolean).join(" ").trim() ||
    fullNameFallback?.trim() ||
    "Cliente";

  const line2Parts = [addr.apartment, addr.company].filter(Boolean);
  const line2 = line2Parts.length ? line2Parts.join(" · ") : undefined;

  return {
    name,
    phone: addr.phone?.trim() || undefined,
    address: {
      line1: street,
      line2,
      city,
      state: addr.state?.trim() || undefined,
      postal_code: addr.postal_code?.trim() || undefined,
      country,
    },
  };
}

/**
 * Si el usuario tiene dirección guardada, se sincroniza en un Stripe Customer
 * y Checkout la muestra rellena (el cliente puede corregirla; `customer_update` lo persiste).
 * @see https://stripe.com/docs/api/customers/object#customer_object-shipping
 */
async function checkoutIdentityParams(
  stripe: Stripe,
  user: SessionUser | null,
  email: string | undefined,
): Promise<
  | { customer: string; customer_update: { shipping: "auto"; address: "auto" } }
  | { customer_email?: string }
> {
  if (!user) {
    return { customer_email: email };
  }

  const [addr, existingCustomerId] = await Promise.all([
    repoGetDefaultShippingAddressForUser(user.id),
    repoGetProfileStripeCustomerId(user.id),
  ]);

  const shipping = addr
    ? buildStripeShippingFromAddress(addr, user.fullName ?? undefined)
    : null;

  if (existingCustomerId) {
    if (shipping) {
      await stripe.customers.update(existingCustomerId, { shipping });
    }
    return {
      customer: existingCustomerId,
      customer_update: { shipping: "auto", address: "auto" },
    };
  }

  if (shipping) {
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      name: user.fullName?.trim() || undefined,
      metadata: { supabase_user_id: user.id },
      shipping,
    });
    await repoSetProfileStripeCustomerId(user.id, customer.id);
    return {
      customer: customer.id,
      customer_update: { shipping: "auto", address: "auto" },
    };
  }

  return { customer_email: email };
}

/**
 * Crea una [Stripe Checkout](https://stripe.com/docs/payments/checkout) Session
 * y devuelve la URL de la página de pago alojada por Stripe.
 */
export async function createHostedCheckoutSession(
  items: GcCartItem[],
  locale: "es" | "en" = "es",
): Promise<{ url: string }> {
  if (!items.length) {
    throw new CheckoutSessionError("El carrito está vacío.");
  }
  if (items.length > 100) {
    throw new CheckoutSessionError("Demasiadas líneas en el pedido.");
  }

  const user = await getCurrentUserService();
  const tier = resolveStorefrontPriceTier(user?.role);

  const ids = [...new Set(items.map((i) => i.productId))];
  const products = await getStorefrontProductsByIds(ids);
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));

  /**
   * Stripe Tax: siempre activo en Checkout. Los precios del catálogo se interpretan como
   * importe base sin impuesto; Stripe añade impuestos según configuración en el Dashboard.
   */
  const priceTaxBehavior = "exclusive" as const;

  type SessionCreateParams = NonNullable<
    Parameters<Stripe["checkout"]["sessions"]["create"]>[0]
  >;
  const lineItems: NonNullable<SessionCreateParams["line_items"]> = [];
  let subtotalUsd = 0;

  type PreparedLine = {
    product: StorefrontProduct;
    qty: number;
    unitUsd: number;
  };
  const prepared: PreparedLine[] = [];

  for (const line of items) {
    const product = byId[line.productId];
    if (!product) {
      throw new CheckoutSessionError(
        "Un producto del carrito ya no está disponible. Actualiza el carrito e inténtalo de nuevo.",
      );
    }
    if (line.qty < 1 || line.qty > 999) {
      throw new CheckoutSessionError("Cantidad no válida en una línea del pedido.");
    }
    if (product.stock < line.qty) {
      throw new CheckoutSessionError(
        `Stock insuficiente para «${product.name}». Ajusta las cantidades e inténtalo de nuevo.`,
      );
    }

    const unitUsd = unitPriceUsd(product, tier);
    const unitCentsUnscaled = dollarsToCents(unitUsd);
    if (unitCentsUnscaled < 1) {
      throw new CheckoutSessionError(
        `El producto «${product.name}» no tiene un importe válido para cobrar.`,
      );
    }

    subtotalUsd += unitUsd * line.qty;
    prepared.push({ product, qty: line.qty, unitUsd });
  }

  const siteOffer = await getPublicSiteOffer();
  const {
    applies: siteOfferApplied,
    discountUsd,
    unitPriceFactor,
  } = computeSiteOfferOnSubtotal(subtotalUsd, siteOffer);

  for (const { product, qty, unitUsd } of prepared) {
    const chargedUnitUsd = unitUsd * unitPriceFactor;
    const unitCents = dollarsToCents(chargedUnitUsd);
    if (unitCents < 1) {
      throw new CheckoutSessionError(
        `El producto «${product.name}» no tiene un importe válido para cobrar.`,
      );
    }

    lineItems.push({
      quantity: qty,
      price_data: {
        currency: "usd",
        unit_amount: unitCents,
        tax_behavior: priceTaxBehavior,
        product_data: {
          name: product.name,
          metadata: {
            product_id: product.id,
          },
        },
      },
    });
  }

  const payableUsd = subtotalUsd * unitPriceFactor;

  if (payableUsd < MIN_CHECKOUT_USD) {
    throw new CheckoutSessionError(
      `El importe mínimo para pagar con tarjeta es $${MIN_CHECKOUT_USD.toFixed(2)} USD.`,
    );
  }

  const shippingLines: ShippingQuoteLineInput[] = prepared.map(
    ({ product, qty }) => ({
      productId: product.id,
      quantity: qty,
      shippingType: product.shipping_type ?? "standard",
      shippingSurchargePerUnit: product.shipping_surcharge_per_unit ?? 0,
    }),
  );
  const shippingQuote = await quoteShippingService({
    subtotal: subtotalUsd,
    lines: shippingLines,
  });

  if (shippingQuote.requiresQuote) {
    throw new CheckoutSessionError(
      "Este pedido supera el límite de cálculo automático de envío. Solicita una cotización por WhatsApp.",
    );
  }
  if (shippingQuote.status !== "ok") {
    throw new CheckoutSessionError(
      "No hay una tarifa de envío disponible para este subtotal. Revisa la configuración de envíos.",
    );
  }

  const shippingCents = dollarsToCents(shippingQuote.shippingTotal);
  /** Stripe exige shipping_options con al menos un importe (puede ser 0). */
  const shippingOptions: NonNullable<
    SessionCreateParams["shipping_options"]
  > = [
    {
      shipping_rate_data: {
        type: "fixed_amount",
        fixed_amount: {
          amount: shippingCents,
          currency: "usd",
        },
        display_name:
          shippingQuote.shippingTotal <= 0
            ? "Envío"
            : shippingQuote.surchargesTotal > 0
              ? "Envío (tarifa + recargos)"
              : "Envío",
      },
    },
  ];

  const base = getAppBaseUrl();
  const stripe = getStripe();

  const email = user?.email?.trim();
  const identity = await checkoutIdentityParams(stripe, user, email);

  const checkoutLocale = locale === "en" ? "en" : "es";
  console.info("[checkout] sesión Stripe", { locale: checkoutLocale });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    locale: checkoutLocale,
    line_items: lineItems,
    success_url: `${base}/cart/success?session_id={CHECKOUT_SESSION_ID}&locale=${checkoutLocale}`,
    cancel_url: `${base}/cart`,
    client_reference_id: user?.id,
    ...identity,
    automatic_tax: { enabled: true },
    shipping_address_collection: {
      allowed_countries: shippingAllowedCountries(),
    },
    shipping_options: shippingOptions,
    phone_number_collection: {
      enabled: true,
    },
    metadata: {
      source: "storefront",
      locale: checkoutLocale,
      site_offer_applied: siteOfferApplied ? "true" : "false",
      amount_discount: String(discountUsd),
      shipping_base: String(shippingQuote.baseRate),
      shipping_surcharges: String(shippingQuote.surchargesTotal),
      shipping_total: String(shippingQuote.shippingTotal),
      shipping_method: shippingQuote.requiresQuote ? "manual" : "automatic",
    },
  });

  if (!session.url) {
    throw new CheckoutSessionError(
      "No se pudo obtener la URL de pago. Inténtalo de nuevo.",
      500,
    );
  }

  return { url: session.url };
}
