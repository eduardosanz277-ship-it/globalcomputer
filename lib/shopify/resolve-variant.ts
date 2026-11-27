/**
 * Resolución SKU → variante de Shopify.
 *
 * Fuente principal: `sku-variant-map.json` (copia versionada del mapa
 * generado desde el catálogo de Shopify: 345 SKU). Si un SKU no está en el
 * mapa, `resolveShopifyVariantBySkuLive` lo busca en vivo en la Storefront
 * API con coincidencia exacta, así un producto recién creado en Shopify se
 * puede pagar sin regenerar el mapa ni redesplegar.
 *
 * Solo servidor: el mapa no debe viajar al navegador.
 */

import skuVariantMap from "@/lib/shopify/sku-variant-map.json";
import { storefrontFetch } from "@/lib/shopify/storefront-client";

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

const LIVE_VARIANT_QUERY = `
  query($q: String!) {
    products(first: 10, query: $q) {
      nodes {
        id
        title
        variants(first: 25) {
          nodes {
            id
            sku
            availableForSale
            price { amount }
          }
        }
      }
    }
  }
`;

type LiveVariantData = {
  products: {
    nodes: {
      id: string;
      title: string;
      variants: {
        nodes: {
          id: string;
          sku: string;
          availableForSale: boolean;
          price: { amount: string };
        }[];
      };
    }[];
  };
};

/** Caché en memoria del proceso: un SKU resuelto en vivo no se vuelve a buscar. */
const liveCache = new Map<string, ShopifyVariantMapping | null>();

/**
 * Resolución con respaldo en vivo: si el SKU no está en el mapa versionado
 * (producto creado en Shopify después de la última regeneración del mapa),
 * lo busca en la Storefront API y filtra por coincidencia EXACTA de SKU,
 * porque la búsqueda de Shopify es parcial y puede devolver otros modelos.
 * Sin coincidencia exacta devuelve null, igual que el mapa.
 */
export async function resolveShopifyVariantBySkuLive(
  sku: string | null | undefined,
): Promise<ShopifyVariantMapping | null> {
  const fromMap = resolveShopifyVariantBySku(sku);
  if (fromMap) return fromMap;

  const clean = sku?.trim();
  if (!clean) return null;
  const cacheKey = clean.toLowerCase();
  if (liveCache.has(cacheKey)) return liveCache.get(cacheKey) ?? null;

  let resolved: ShopifyVariantMapping | null = null;
  try {
    const data = await storefrontFetch<LiveVariantData>(LIVE_VARIANT_QUERY, {
      q: `sku:${clean}`,
    });
    for (const product of data.products.nodes) {
      for (const variant of product.variants.nodes) {
        if (variant.sku?.trim().toLowerCase() === cacheKey && variant.availableForSale) {
          resolved = {
            product_gid: product.id,
            variant_gid: variant.id,
            title: product.title,
            price: variant.price.amount,
            status: "ACTIVE",
          };
          break;
        }
      }
      if (resolved) break;
    }
  } catch {
    resolved = null;
  }

  liveCache.set(cacheKey, resolved);
  return resolved;
}
