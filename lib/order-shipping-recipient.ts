export type OrderShippingRecipient = {
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string | null;
  addressLine: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
};

export function mapStoreOrderShippingAddressRow(
  row: {
    recipient_name?: string | null;
    recipient_phone?: string | null;
    recipient_email?: string | null;
    address_line?: string | null;
    address_line_2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
  } | null | undefined,
): OrderShippingRecipient | null {
  if (!row) return null;
  const recipientName = String(row.recipient_name ?? "").trim();
  const recipientPhone = String(row.recipient_phone ?? "").trim();
  const addressLine = String(row.address_line ?? "").trim();
  const city = String(row.city ?? "").trim();
  const postalCode = String(row.postal_code ?? "").trim();
  const country = String(row.country ?? "").trim();
  if (!recipientName || !recipientPhone || !addressLine || !city || !postalCode) {
    return null;
  }
  return {
    recipientName,
    recipientPhone,
    recipientEmail: String(row.recipient_email ?? "").trim() || null,
    addressLine,
    addressLine2: String(row.address_line_2 ?? "").trim() || null,
    city,
    state: String(row.state ?? "").trim() || null,
    postalCode,
    country: country || "US",
  };
}
