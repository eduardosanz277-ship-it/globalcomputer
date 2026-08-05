import { NextResponse } from "next/server";
import { getPublicSiteOffer } from "@/lib/site-offer.server";
import type { GcCartItem } from "@/lib/store-cart";
import {
  resolveStorefrontPriceTier,
  resolveStorefrontUnitPrice,
} from "@/lib/storefront-pricing";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { storefrontProductDisplayName } from "@/modules/catalog/storefront-product.shared";
import { getStorefrontProductsByIds } from "@/modules/catalog/storefront-products.service";
import { quoteShippingService } from "@/modules/shipping/shipping.service";
import type { ShippingQuoteLineInput } from "@/modules/shipping/shipping.types";

export const dynamic = "force-dynamic";

type Body = {
  items?: GcCartItem[];
  locale?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const items = Array.isArray(body.items) ? body.items : [];
    const locale = body.locale === "en" ? "en" : "es";
    if (items.length === 0) {
      return NextResponse.json({
        status: "ok",
        subtotal: 0,
        baseRate: 0,
        surchargesTotal: 0,
        shippingTotal: 0,
        freeShippingApplied: false,
        requiresQuote: false,
        overLimitAction: null,
        whatsappUrl: null,
        matchedRateId: null,
        surchargeLines: [],
        messageKey: null,
      });
    }

    const user = await getCurrentUserService();
    const tier = resolveStorefrontPriceTier(user?.role);
    const ids = [...new Set(items.map((i) => i.productId))];
    const [products, offer] = await Promise.all([
      getStorefrontProductsByIds(ids),
      getPublicSiteOffer(),
    ]);
    const byId = Object.fromEntries(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const lines: ShippingQuoteLineInput[] = [];

    for (const line of items) {
      const product = byId[line.productId];
      if (!product) continue;
      const qty = Math.max(0, Math.floor(line.qty));
      if (qty <= 0) continue;
      const unit = resolveStorefrontUnitPrice(product, tier);
      subtotal += unit * qty;
      lines.push({
        productId: product.id,
        quantity: qty,
        shippingType: product.shipping_type ?? "standard",
        shippingSurchargePerUnit: product.shipping_surcharge_per_unit ?? 0,
        productName: storefrontProductDisplayName(product, locale),
        unitPrice: unit,
      });
    }

    const quote = await quoteShippingService({
      subtotal,
      lines,
      offer,
      locale,
    });
    return NextResponse.json(quote);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo calcular el envío";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
