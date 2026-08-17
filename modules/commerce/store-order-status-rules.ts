/**
 * Reglas de estado tras un pago Stripe.
 *
 * - Pago OK → `confirmed`
 * - Nunca `processing` desde Stripe
 * - `processing` / envío / completado / cancelado solo los aplica el admin
 */

export const ADMIN_OWNED_ORDER_STATUSES = [
  "processing",
  "shipping",
  "completed",
  "cancelled",
] as const;

export function isAdminOwnedOrderStatus(status: unknown): boolean {
  return (
    typeof status === "string" &&
    (ADMIN_OWNED_ORDER_STATUSES as readonly string[]).includes(status)
  );
}

/** Si el admin ya avanzó el flujo, Stripe no lo toca. */
export function resolveStatusAfterStripePayment(current: unknown) {
  if (isAdminOwnedOrderStatus(current)) return current;
  return "confirmed";
}

/**
 * Solo se escribe `confirmed` desde Stripe si el pedido sigue pendiente.
 * No reescribe `confirmed` ni estados del admin (evita el tira y afloja del webhook).
 */
export function canStripePromoteToConfirmed(current: unknown) {
  return current == null || current === "" || current === "pending";
}
