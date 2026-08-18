import type Stripe from "stripe";

export type StoreOrderShippingAddressFields = {
  recipient_name: string;
  recipient_phone: string;
  recipient_email: string | null;
  address_line: string;
  address_line_2: string | null;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
};

type StripeShippingDetails = {
  name?: string | null;
  phone?: string | null;
  address?: Stripe.Address | null;
};

function stripeSessionShippingDetails(
  session: Stripe.Checkout.Session,
): StripeShippingDetails | null {
  const collected = (
    session as Stripe.Checkout.Session & {
      collected_information?: { shipping_details?: StripeShippingDetails | null };
    }
  ).collected_information?.shipping_details;
  if (collected?.address || collected?.name) return collected;

  const legacy = (
    session as Stripe.Checkout.Session & {
      shipping_details?: StripeShippingDetails | null;
    }
  ).shipping_details;
  if (legacy?.address || legacy?.name) return legacy;

  return null;
}

export function shippingAddressLinesFromDb(row: {
  recipient_name?: string | null;
  recipient_phone?: string | null;
  address_line?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
} | null | undefined): string[] {
  if (!row || typeof row !== "object") return [];
  const lines: string[] = [];
  const name = row.recipient_name?.trim();
  if (name) lines.push(name);

  const street = [row.address_line, row.address_line_2]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
  if (street) lines.push(street);

  const cityLine = [row.postal_code, row.city, row.state]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  if (cityLine) lines.push(cityLine);

  if (row.country?.trim()) lines.push(row.country.trim().toUpperCase());

  const phone = row.recipient_phone?.trim();
  if (phone && phone !== "—") lines.push(phone);

  return lines;
}

export function shippingAddressFromStripeSession(
  session: Stripe.Checkout.Session,
): StoreOrderShippingAddressFields | null {
  const details = stripeSessionShippingDetails(session);
  const address =
    details?.address ?? session.customer_details?.address ?? null;
  const name =
    details?.name?.trim() || session.customer_details?.name?.trim() || "";
  const phone =
    details?.phone?.trim() || session.customer_details?.phone?.trim() || "";
  const email = session.customer_details?.email?.trim() || null;
  const addressLine = address?.line1?.trim() || "";
  const city = address?.city?.trim() || "";
  const postalCode = address?.postal_code?.trim() || "";
  const country = address?.country?.trim().toUpperCase() || "";

  if (!name || !addressLine || !city || !postalCode || !country) {
    return null;
  }

  return {
    recipient_name: name,
    recipient_phone: phone || "—",
    recipient_email: email,
    address_line: addressLine,
    address_line_2: address?.line2?.trim() || null,
    city,
    state: address?.state?.trim() || null,
    postal_code: postalCode,
    country,
  };
}

export function shippingAddressLinesFromStripeSession(
  session: Stripe.Checkout.Session,
): string[] {
  const fields = shippingAddressFromStripeSession(session);
  if (fields) return shippingAddressLinesFromDb(fields);

  const details = stripeSessionShippingDetails(session);
  const address =
    details?.address ?? session.customer_details?.address ?? null;
  const lines: string[] = [];
  const name =
    details?.name?.trim() || session.customer_details?.name?.trim();
  if (name) lines.push(name);
  if (address) {
    const street = [address.line1, address.line2]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(", ");
    if (street) lines.push(street);
    const cityLine = [
      address.postal_code?.trim(),
      address.city?.trim(),
      address.state?.trim(),
    ]
      .filter(Boolean)
      .join(" ");
    if (cityLine) lines.push(cityLine);
    if (address.country?.trim()) {
      lines.push(address.country.trim().toUpperCase());
    }
  }
  const phone =
    details?.phone?.trim() || session.customer_details?.phone?.trim();
  if (phone) lines.push(phone);
  return lines;
}
