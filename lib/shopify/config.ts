/**
 * Configuración de la integración headless con Shopify (solo servidor).
 *
 * Interruptor de proveedor de checkout:
 * - `CHECKOUT_PROVIDER=stripe` (por defecto) → flujo actual con Stripe Checkout.
 * - `CHECKOUT_PROVIDER=shopify` → el checkout se crea en Shopify (Storefront API)
 *   y el cliente paga en el checkout alojado de Shopify.
 *
 * Variables requeridas cuando el proveedor es Shopify:
 * - `SHOPIFY_STORE_DOMAIN` — p. ej. `n0e134-e0.myshopify.com` (sin protocolo).
 * - `SHOPIFY_STOREFRONT_ACCESS_TOKEN` — token PÚBLICO de Storefront API
 *   (canal Headless). Es un token público por diseño, pero se mantiene en
 *   variables de entorno para poder rotarlo sin tocar código.
 * - `SHOPIFY_API_VERSION` — opcional, por defecto `2025-10`.
 */

export type CheckoutProvider = "stripe" | "shopify";

export function getCheckoutProvider(): CheckoutProvider {
  const raw = process.env.CHECKOUT_PROVIDER?.trim().toLowerCase();
  return raw === "shopify" ? "shopify" : "stripe";
}

export type ShopifyConfig = {
  storeDomain: string;
  storefrontAccessToken: string;
  apiVersion: string;
  graphqlEndpoint: string;
};

export class ShopifyConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShopifyConfigError";
  }
}

export function getShopifyConfig(): ShopifyConfig {
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN?.trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
  const storefrontAccessToken =
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim();
  const apiVersion = process.env.SHOPIFY_API_VERSION?.trim() || "2025-10";

  if (!storeDomain || !storefrontAccessToken) {
    throw new ShopifyConfigError(
      "Shopify no está configurado (faltan SHOPIFY_STORE_DOMAIN o SHOPIFY_STOREFRONT_ACCESS_TOKEN en el servidor).",
    );
  }

  return {
    storeDomain,
    storefrontAccessToken,
    apiVersion,
    graphqlEndpoint: `https://${storeDomain}/api/${apiVersion}/graphql.json`,
  };
}
