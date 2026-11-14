/**
 * Cliente mínimo de la Shopify Storefront API (GraphQL), solo servidor.
 * Sin dependencias nuevas: usa `fetch` de Node 18+.
 *
 * El token de Storefront es público por diseño (canal Headless), pero viaja
 * siempre en el encabezado `X-Shopify-Storefront-Access-Token` leído de la
 * configuración de entorno; nunca se escribe en código ni en logs.
 */

import { getShopifyConfig } from "@/lib/shopify/config";

export class ShopifyStorefrontError extends Error {
  constructor(
    message: string,
    public statusCode: number = 502,
  ) {
    super(message);
    this.name = "ShopifyStorefrontError";
  }
}

type GraphQLErrorItem = { message?: string };

type GraphQLResponse<T> = {
  data?: T;
  errors?: GraphQLErrorItem[];
};

/**
 * Ejecuta una operación GraphQL contra la Storefront API.
 * Lanza {@link ShopifyStorefrontError} ante fallo de red, HTTP o GraphQL.
 */
export async function storefrontFetch<TData>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<TData> {
  const config = getShopifyConfig();

  let res: Response;
  try {
    res = await fetch(config.graphqlEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Shopify-Storefront-Access-Token": config.storefrontAccessToken,
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });
  } catch {
    throw new ShopifyStorefrontError(
      "No se pudo contactar con Shopify. Inténtalo de nuevo.",
      503,
    );
  }

  if (!res.ok) {
    throw new ShopifyStorefrontError(
      `Shopify respondió con un error (HTTP ${res.status}).`,
      res.status === 401 || res.status === 403 ? 503 : 502,
    );
  }

  const payload = (await res.json().catch(() => null)) as
    | GraphQLResponse<TData>
    | null;

  if (!payload || (!payload.data && !payload.errors)) {
    throw new ShopifyStorefrontError("Respuesta no válida de Shopify.", 502);
  }

  if (payload.errors?.length) {
    const first = payload.errors.find((e) => e.message)?.message;
    throw new ShopifyStorefrontError(
      first
        ? `Error de Shopify: ${first}`
        : "Shopify devolvió un error inesperado.",
      502,
    );
  }

  if (!payload.data) {
    throw new ShopifyStorefrontError("Respuesta vacía de Shopify.", 502);
  }

  return payload.data;
}
