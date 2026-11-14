/**
 * Checkout con Shopify (headless): crea un carrito en Shopify a partir del
 * carrito local del sitio y devuelve la URL del checkout alojado por Shopify.
 *
 * Se activa solo con `CHECKOUT_PROVIDER=shopify` (ver `lib/shopify/config.ts`);
 * con cualquier otro valor el sitio sigue usando Stripe Checkout como hasta
 * ahora. Pensado para ser reversible: basta cambiar la variable y redesplegar.
 *
 * Notas de comportamiento frente a Stripe (decisiones del corte, no errores):
 * - El precio cobrado es el de la variante en Shopify, no el precio por nivel
 *   (cliente/empresa) ni el descuento de oferta del sitio calculados en
 *   Supabase. Los precios espejo en Shopify se crearon desde el catálogo web.
 * - Envío e impuestos los calcula Shopify según su configuración de tienda
 *   (tarifa «Envío» $2.00 a todo EE. UU. e impuesto de Florida, configurados
 *   como espejo del checkout actual).
 * - Las órdenes se crean y viven en Shopify; no pasan por el webhook de
 *   Stripe ni por las tablas `store_orders*` de Supabase.
 */

import type { GcCartItem } from "@/lib/store-cart";
import { ShopifyConfigError } from "@/lib/shopify/config";
import { resolveShopifyVariantBySku } from "@/lib/shopify/resolve-variant";
import { createShopifyCart } from "@/lib/shopify/cart";
import { ShopifyStorefrontError } from "@/lib/shopify/storefront-client";
import { getStorefrontProductsByIds } from "@/modules/catalog/storefront-products.service";
import { CheckoutSessionError } from "@/modules/commerce/stripe-checkout.service";

export async function createShopifyCheckoutSession(
  items: GcCartItem[],
  locale: "es" | "en" = "es",
): Promise<{ url: string; cartId: string }> {
  void locale; // El idioma del checkout lo resuelve Shopify según su tienda.
  if (!items.length) {
    throw new CheckoutSessionError("El carrito está vacío.");
  }
  if (items.length > 100) {
    throw new CheckoutSessionError("Demasiadas líneas en el pedido.");
  }

  const ids = [...new Set(items.map((i) => i.productId))];
  const products = await getStorefrontProductsByIds(ids);
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));

  const lines: { merchandiseId: string; quantity: number }[] = [];
  const unmappedNames: string[] = [];

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

    const mapping = resolveShopifyVariantBySku(product.sku);
    if (!mapping) {
      unmappedNames.push(product.name);
      continue;
    }
    lines.push({ merchandiseId: mapping.variant_gid, quantity: line.qty });
  }

  if (unmappedNames.length > 0) {
    throw new CheckoutSessionError(
      `Estos productos aún no están disponibles para pago en línea: ${unmappedNames.join(", ")}.`,
    );
  }

  try {
    const cart = await createShopifyCart(lines);
    return { url: cart.checkoutUrl, cartId: cart.id };
  } catch (e) {
    if (e instanceof ShopifyConfigError) {
      throw new CheckoutSessionError(e.message, 503);
    }
    if (e instanceof ShopifyStorefrontError) {
      throw new CheckoutSessionError(e.message, e.statusCode);
    }
    throw e;
  }
}
