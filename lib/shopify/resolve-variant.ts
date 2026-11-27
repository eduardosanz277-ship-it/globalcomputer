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

const LIVE_CATALOG_QUERY = `
  query($cursor: String) {
    products(first: 100, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        title
        variants(first: 10) {
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

type LiveCatalogData = {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
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

/**
 * Mapa vivo completo SKU → variante, cargado una sola vez por proceso.
 * Se construye paginando todo el catálogo de la Storefront API: es la
 * única vía determinista, porque la búsqueda por texto de Shopify es
 * parcial (un SKU con tokens comunes devuelve otros modelos).
 */
let liveCatalogPromise: Promise<Map<string, ShopifyVariantMapping>> | null =
  null;

function loadLiveCatalog(): Promise<Map<string, ShopifyVariantMapping>> {
  if (!liveCatalogPromise) {
    liveCatalogPromise = (async () => {
      const catalog = new Map<string, ShopifyVariantMapping>();
      let cursor: string | null = null;
      for (let page = 0; page < 20; page++) {
        const data: LiveCatalogData = await storefrontFetch<LiveCatalogData>(
          LIVE_CATALOG_QUERY,
          { cursor },
        );
        for (const product of data.products.nodes) {
          for (const variant of product.variants.nodes) {
            const key = variant.sku?.trim().toLowerCase();
            if (key && variant.availableForSale && !catalog.has(key)) {
              catalog.set(key, {
                product_gid: product.id,
                variant_gid: variant.id,
                title: product.title,
                price: variant.price.amount,
                status: "ACTIVE",
              });
            }
          }
        }
        if (!data.products.pageInfo.hasNextPage) break;
        cursor = data.products.pageInfo.endCursor;
      }
      return catalog;
    })();
    // Si la carga falla, no dejar la promesa rechazada en caché.
    liveCatalogPromise.catch(() => {
      liveCatalogPromise = null;
    });
  }
  return liveCatalogPromise;
}

/**
 * Resolución con respaldo en vivo: si el SKU no está en el mapa versionado
 * (producto creado en Shopify después de la última regeneración del mapa),
 * lo busca en el catálogo vivo completo de la Storefront API, con
 * coincidencia EXACTA de SKU. Sin coincidencia devuelve null, igual que
 * el mapa.
 */
export async function resolveShopifyVariantBySkuLive(
  sku: string | null | undefined,
): Promise<ShopifyVariantMapping | null> {
  const fromMap = resolveShopifyVariantBySku(sku);
  if (fromMap) return fromMap;

  const clean = sku?.trim();
  if (!clean) return null;

  try {
    const catalog = await loadLiveCatalog();
    return catalog.get(clean.toLowerCase()) ?? null;
  } catch {
    return null;
  }
}
