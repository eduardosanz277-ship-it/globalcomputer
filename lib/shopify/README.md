# Integración headless con Shopify (Fase 3)

El sitio sigue siendo la vitrina y el panel de administración (Supabase). Shopify
actúa solo como motor de pago cuando se activa el interruptor.

## Interruptor

| Variable | Valor | Efecto |
| --- | --- | --- |
| `CHECKOUT_PROVIDER` | `stripe` (defecto) | Checkout histórico con Stripe. |
| `CHECKOUT_PROVIDER` | `shopify` | `POST /api/checkout/session` crea un carrito en Shopify y devuelve su `checkoutUrl`. |

Revertir = volver a `stripe` (o borrar la variable) y redesplegar. Sin cambios
de código ni de rutas: la respuesta del endpoint sigue siendo `{ url }`.

Variables extra con `shopify`: `SHOPIFY_STORE_DOMAIN`,
`SHOPIFY_STOREFRONT_ACCESS_TOKEN` (token público del canal Headless) y
opcionalmente `SHOPIFY_API_VERSION` (defecto `2025-10`). Ver `.env.example`.

## Piezas

- `config.ts` — interruptor y configuración de entorno (solo servidor).
- `storefront-client.ts` — cliente GraphQL mínimo de la Storefront API.
- `cart.ts` — `cartCreate`, `cartLinesAdd`, `cartLinesUpdate`,
  `cartLinesRemove` y consulta de carrito.
- `resolve-variant.ts` + `sku-variant-map.json` — resolución SKU → variante.
- `modules/commerce/shopify-checkout.service.ts` — valida el carrito local
  (mismas reglas que el servicio de Stripe), resuelve variantes y crea el
  carrito de Shopify.

## Mapa SKU → variante

`sku-variant-map.json` es una copia versionada del mapa generado al crear el
catálogo espejo (257 SKU). Si se crean productos nuevos en Shopify, hay que
regenerar el mapa y sustituir este archivo; un producto sin entrada produce un
error explícito al pagar («aún no está disponible para pago en línea»), nunca
un fallback silencioso.

## Diferencias conocidas frente a Stripe (decisiones del corte)

- Cobra el precio de la variante en Shopify; no se aplican precio por nivel
  (cliente/empresa), descuentos por producto ni la oferta del sitio de
  Supabase dentro del checkout de Shopify.
- Envío e impuestos los calcula Shopify con su configuración espejo
  («Envío» $2.00 a todo EE. UU., impuesto solo en Florida).
- Las órdenes viven en Shopify: no entran por el webhook de Stripe ni se
  registran en las tablas `store_orders*` de Supabase.
- La etiqueta del botón de pago en el carrito sigue diciendo «Pagar con
  Stripe» (i18n `storefront.cart.payWithStripe`); cambiarla es un ajuste
  cosmético pendiente para el momento del corte.
- El catálogo, el detalle de producto y el carrito local no cambian: el
  carrito sigue en `localStorage` con reservas de inventario en Supabase.
