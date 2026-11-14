/**
 * Operaciones de carrito de la Shopify Storefront API (2025-10), solo servidor.
 *
 * El checkout del sitio crea un carrito nuevo con todas las líneas y redirige
 * al `checkoutUrl` alojado por Shopify. Las operaciones de líneas quedan
 * disponibles para una futura sincronización de carrito persistente.
 */

import {
  storefrontFetch,
  ShopifyStorefrontError,
} from "@/lib/shopify/storefront-client";

export type ShopifyCartLineInput = {
  merchandiseId: string;
  quantity: number;
};

export type ShopifyCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
};

type UserError = { field?: string[] | null; message: string };

const CART_FIELDS = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
  }
`;

function assertNoUserErrors(
  userErrors: UserError[] | undefined,
  fallback: string,
): void {
  if (userErrors?.length) {
    throw new ShopifyStorefrontError(
      userErrors.map((e) => e.message).join(" ") || fallback,
      400,
    );
  }
}

const CART_CREATE_MUTATION = /* GraphQL */ `
  ${CART_FIELDS}
  mutation CartCreate($lines: [CartLineInput!]!) {
    cartCreate(input: { lines: $lines }) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;

const CART_LINES_ADD_MUTATION = /* GraphQL */ `
  ${CART_FIELDS}
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;

const CART_LINES_UPDATE_MUTATION = /* GraphQL */ `
  ${CART_FIELDS}
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;

const CART_LINES_REMOVE_MUTATION = /* GraphQL */ `
  ${CART_FIELDS}
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;

const CART_QUERY = /* GraphQL */ `
  ${CART_FIELDS}
  query CartById($cartId: ID!) {
    cart(id: $cartId) { ...CartFields }
  }
`;

type CartPayload = { cart: ShopifyCart | null; userErrors?: UserError[] };

export async function createShopifyCart(
  lines: ShopifyCartLineInput[],
): Promise<ShopifyCart> {
  const data = await storefrontFetch<{ cartCreate: CartPayload }>(
    CART_CREATE_MUTATION,
    { lines },
  );
  assertNoUserErrors(data.cartCreate.userErrors, "No se pudo crear el carrito en Shopify.");
  if (!data.cartCreate.cart?.checkoutUrl) {
    throw new ShopifyStorefrontError(
      "Shopify no devolvió la URL de pago del carrito.",
      502,
    );
  }
  return data.cartCreate.cart;
}

export async function addShopifyCartLines(
  cartId: string,
  lines: ShopifyCartLineInput[],
): Promise<ShopifyCart> {
  const data = await storefrontFetch<{ cartLinesAdd: CartPayload }>(
    CART_LINES_ADD_MUTATION,
    { cartId, lines },
  );
  assertNoUserErrors(data.cartLinesAdd.userErrors, "No se pudieron añadir líneas al carrito de Shopify.");
  if (!data.cartLinesAdd.cart) {
    throw new ShopifyStorefrontError("El carrito de Shopify ya no existe.", 404);
  }
  return data.cartLinesAdd.cart;
}

export async function updateShopifyCartLines(
  cartId: string,
  lines: { id: string; quantity: number }[],
): Promise<ShopifyCart> {
  const data = await storefrontFetch<{ cartLinesUpdate: CartPayload }>(
    CART_LINES_UPDATE_MUTATION,
    { cartId, lines },
  );
  assertNoUserErrors(data.cartLinesUpdate.userErrors, "No se pudieron actualizar las líneas del carrito de Shopify.");
  if (!data.cartLinesUpdate.cart) {
    throw new ShopifyStorefrontError("El carrito de Shopify ya no existe.", 404);
  }
  return data.cartLinesUpdate.cart;
}

export async function removeShopifyCartLines(
  cartId: string,
  lineIds: string[],
): Promise<ShopifyCart> {
  const data = await storefrontFetch<{ cartLinesRemove: CartPayload }>(
    CART_LINES_REMOVE_MUTATION,
    { cartId, lineIds },
  );
  assertNoUserErrors(data.cartLinesRemove.userErrors, "No se pudieron eliminar líneas del carrito de Shopify.");
  if (!data.cartLinesRemove.cart) {
    throw new ShopifyStorefrontError("El carrito de Shopify ya no existe.", 404);
  }
  return data.cartLinesRemove.cart;
}

export async function getShopifyCart(
  cartId: string,
): Promise<ShopifyCart | null> {
  const data = await storefrontFetch<{ cart: ShopifyCart | null }>(CART_QUERY, {
    cartId,
  });
  return data.cart;
}
