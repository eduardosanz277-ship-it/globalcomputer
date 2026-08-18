export type EmailLocale = "es" | "en";

/** Fallback de correos transaccionales. Independiente del DEFAULT_LOCALE de la UI (`es`). */
export const EMAIL_DEFAULT_LOCALE: EmailLocale = "en";

export const PLACEHOLDER_CUSTOMER_EMAIL = "cliente@globalcomputer.com";

export function orderConfirmationTemplateId(locale: EmailLocale): string {
  return locale === "es" ? "order-confirmation-es" : "order-confirmation-en";
}

/** `es` | `en` si el valor es reconocible; si no, `null`. */
export function recognizedEmailLocale(value: unknown): EmailLocale | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase();
  if (!v || v === "auto") return null;
  if (v === "es" || v.startsWith("es-")) return "es";
  if (v === "en" || v.startsWith("en-")) return "en";
  return null;
}

/**
 * Idioma del correo de confirmación: solo `store_orders.locale`.
 * Cualquier valor no soportado → inglés.
 */
export function resolveOrderConfirmationEmailLocale(
  orderLocale: unknown,
): EmailLocale {
  return recognizedEmailLocale(orderLocale) ?? EMAIL_DEFAULT_LOCALE;
}

export function isUsableCustomerEmail(email: unknown): boolean {
  const v = String(email ?? "").trim().toLowerCase();
  if (!v.includes("@")) return false;
  return v !== PLACEHOLDER_CUSTOMER_EMAIL;
}

export function isPlaceholderCustomerEmail(email: unknown): boolean {
  const v = String(email ?? "").trim().toLowerCase();
  return !v || v === PLACEHOLDER_CUSTOMER_EMAIL;
}

export function stripeSessionCustomerEmail(session: {
  customer_details?: { email?: string | null } | null;
  customer_email?: string | null;
} | null | undefined): string | null {
  const raw =
    session?.customer_details?.email?.trim() ||
    session?.customer_email?.trim() ||
    "";
  const email = raw.toLowerCase();
  return isUsableCustomerEmail(email) ? email : null;
}

export function stripeSessionCustomerName(session: {
  customer_details?: { name?: string | null } | null;
} | null | undefined): string | null {
  const name = session?.customer_details?.name?.trim();
  return name || null;
}

/** Pedidos con `user_id`: enlace a «Ver en mi cuenta». Invitado → null. */
export function storeOrderAccountOrdersUrl(
  appUrl: string,
  userId: unknown,
): string | null {
  const id = String(userId ?? "").trim();
  if (!id) return null;
  return `${appUrl.replace(/\/$/, "")}/profile?tab=orders`;
}

/**
 * Locale del pedido Stripe: metadata del Checkout (lo que pusimos al pagar),
 * luego el locale del POST/URL. Nunca `session.locale` de Stripe ni el default `es` de la UI.
 */
export function resolveCheckoutOrderLocale(
  metadataLocale: unknown,
  payloadLocale?: unknown,
): EmailLocale {
  return (
    recognizedEmailLocale(metadataLocale) ??
    recognizedEmailLocale(payloadLocale) ??
    EMAIL_DEFAULT_LOCALE
  );
}

/**
 * Si el locale de Checkout es reconocible y distinto al guardado, se actualiza.
 * Evita dejar congelado el default `es` de la columna.
 */
export function localePatchForExistingOrder(
  existingLocale: unknown,
  incomingLocale: unknown,
): EmailLocale | undefined {
  const next = recognizedEmailLocale(incomingLocale);
  if (!next) return undefined;
  const current = recognizedEmailLocale(existingLocale);
  if (current === next) return undefined;
  return next;
}
