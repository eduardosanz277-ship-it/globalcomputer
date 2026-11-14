/**
 * Resolución SKU → variante de Shopify.
 *
 * Fuente: `sku-variant-map.json` (copia versionada del mapa generado al crear
 * el catálogo espejo en Shopify: 257 SKU). Si se crean productos nuevos en
 * Shopify, hay que regenerar este archivo desde el generador del mapa; sin
 * entrada en el mapa, el checkout de Shopify rechaza la línea con un error
 * explícito (no hay fallback silencioso a otro proveedor).
 *
 * Solo servidor: el mapa no debe viajar al navegador.
 */

import skuVariantMap from "@/lib/shopify/sku-variant-map.json";

export type ShopifyVariantMapping = {
  product_gid: string;
  variant_gid: string;
  title: string;
  price: string;
  status: string;
};

const map = skuVariantMap as Record<string, ShopifyVariantMapping>;

/** Índice secundario por SKU en minúsculas para tolerar diferencias de caja. */
const lowerIndex: Record<string, ShopifyVariantMapping> = {};
for (const [sku, entry] of Object.entries(map)) {
  const key = sku.trim().toLowerCase();
  if (!(key in lowerIndex)) lowerIndex[key] = entry;
}

export function resolveShopifyVariantBySku(
  sku: string | null | undefined,
): ShopifyVariantMapping | null {
  const clean = sku?.trim();
  if (!clean) return null;
  return map[clean] ?? lowerIndex[clean.toLowerCase()] ?? null;
}

export function hasShopifyVariantMapping(sku: string | null | undefined): boolean {
  return resolveShopifyVariantBySku(sku) !== null;
}
