import { escapeHtml } from "@/lib/email/escapeHtml";

export type OrderEmailLineItem = {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export function formatOrderEmailUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function moneyRow(
  label: string,
  value: string,
  options?: { bold?: boolean },
): string {
  const weight = options?.bold ? "700" : "600";
  const size = options?.bold ? "16px" : "14px";
  const color = options?.bold ? "#0f172a" : "#374151";
  return `<tr>
    <td style="padding:6px 0;font-size:${size};color:#6b7280;">${escapeHtml(label)}</td>
    <td style="padding:6px 0;font-size:${size};font-weight:${weight};color:${color};text-align:right;">${escapeHtml(value)}</td>
  </tr>`;
}

function renderItemsTable(
  items: OrderEmailLineItem[],
  qtyLabel: string,
  fallbackProduct: string,
): string {
  const rows = items
    .map((item) => {
      const name = escapeHtml(item.productName.trim() || fallbackProduct);
      const qty = String(item.quantity);
      const unit = formatOrderEmailUsd(item.unitPrice);
      const total = formatOrderEmailUsd(item.totalPrice);
      return `<tr>
        <td style="padding:14px 0;border-bottom:1px solid #eef2f7;vertical-align:top;">
          <div style="font-size:14px;font-weight:600;color:#0f172a;line-height:1.4;">${name}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;">${escapeHtml(qtyLabel)}: ${qty} · ${escapeHtml(unit)}</div>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid #eef2f7;vertical-align:top;text-align:right;font-size:14px;font-weight:600;color:#0f172a;">${escapeHtml(total)}</td>
      </tr>`;
    })
    .join("");

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">${rows}</table>`;
}

function renderAddress(lines: string[]): string {
  if (lines.length === 0) {
    return `<p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280;">—</p>`;
  }
  return lines
    .map(
      (line) =>
        `<div style="font-size:14px;line-height:1.6;color:#374151;">${escapeHtml(line)}</div>`,
    )
    .join("");
}

export type OrderEmailBodyCopy = {
  fallbackName: string;
  fallbackProduct: string;
  intro: (name: string) => string;
  orderNumberLabel: string;
  orderDateLabel: string;
  summaryTitle: string;
  qtyLabel: string;
  subtotal: string;
  discount: string;
  tax: string;
  shipping: string;
  total: string;
  shippingTitle: string;
  nextStepsTitle: string;
  nextStepsBody: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

export type OrderEmailBodyInput = {
  copy: OrderEmailBodyCopy;
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: OrderEmailLineItem[];
  amountSubtotal: number;
  amountDiscount: number;
  amountTax: number;
  amountShipping: number;
  totalAmount: number;
  shippingAddressLines: string[];
  orderLookupUrl: string;
  /** Solo pedidos con cuenta; si falta, no se muestra «Ver en mi cuenta». */
  profileOrdersUrl?: string | null;
};

export function renderOrderEmailCtas(input: {
  orderLookupUrl: string;
  ctaPrimary: string;
  profileOrdersUrl?: string | null;
  ctaSecondary: string;
}): string {
  const accountUrl = input.profileOrdersUrl?.trim() || "";
  const accountCta = accountUrl
    ? `<div style="margin-top:14px;text-align:center;">
            <a href="${escapeHtml(accountUrl)}" style="display:inline-block;font-size:14px;color:#357fd2;text-decoration:none;font-weight:600;"><span style="color:#357fd2;">${escapeHtml(input.ctaSecondary)}</span></a>
          </div>`
    : "";

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center" style="text-align:center;">
          <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto;">
            <tr>
              <td align="center" bgcolor="#357fd2" style="border-radius:8px;background:#357fd2;background-color:#357fd2;">
                <a href="${escapeHtml(input.orderLookupUrl)}" style="display:inline-block;background:#357fd2;background-color:#357fd2;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;line-height:1;padding:14px 24px;border-radius:8px;">${escapeHtml(input.ctaPrimary)}</a>
              </td>
            </tr>
          </table>
          ${accountCta}
        </td>
      </tr>
    </table>`;
}

/** Cuerpo compartido con la confirmación de pedido (Resend HTML). */
export function renderOrderTransactionalEmailBody(
  input: OrderEmailBodyInput,
): string {
  const t = input.copy;
  const safeOrderNumber = escapeHtml(input.orderNumber);
  const safeDate = escapeHtml(input.orderDate);

  const discountRow =
    input.amountDiscount > 0
      ? moneyRow(t.discount, `−${formatOrderEmailUsd(input.amountDiscount)}`)
      : "";

  return `
    <p style="margin:0 0 20px 0;font-size:15px;line-height:1.65;color:#4b5563;">${escapeHtml(t.intro(input.customerName.trim() || t.fallbackName))}</p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e6ebf1;border-radius:10px;margin-bottom:22px;">
      <tr>
        <td style="padding:16px 18px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#6b7280;">${escapeHtml(t.orderNumberLabel)}</td>
              <td style="font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#6b7280;text-align:right;">${escapeHtml(t.orderDateLabel)}</td>
            </tr>
            <tr>
              <td style="padding-top:6px;font-size:18px;font-weight:700;color:#0f172a;">${safeOrderNumber}</td>
              <td style="padding-top:6px;font-size:14px;font-weight:600;color:#374151;text-align:right;">${safeDate}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#6b7280;margin-bottom:10px;">${escapeHtml(t.summaryTitle)}</div>
    ${renderItemsTable(input.items, t.qtyLabel, t.fallbackProduct)}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:8px;margin-bottom:22px;">
      ${moneyRow(t.subtotal, formatOrderEmailUsd(input.amountSubtotal))}
      ${discountRow}
      ${moneyRow(t.tax, formatOrderEmailUsd(input.amountTax))}
      ${moneyRow(t.shipping, formatOrderEmailUsd(input.amountShipping))}
      <tr><td colspan="2" style="padding-top:8px;border-top:1px solid #e6ebf1;"></td></tr>
      ${moneyRow(t.total, formatOrderEmailUsd(input.totalAmount), { bold: true })}
    </table>

    <div style="font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#6b7280;margin-bottom:10px;">${escapeHtml(t.shippingTitle)}</div>
    <div style="margin-bottom:22px;">${renderAddress(input.shippingAddressLines)}</div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#e8f1fb" style="background:#e8f1fb;background-color:#e8f1fb;border:1px solid #b7d2f0;border-radius:16px;overflow:hidden;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 18px;background:#e8f1fb;background-color:#e8f1fb;border-radius:16px;">
          <div style="font-size:14px;font-weight:700;color:#357fd2;margin-bottom:6px;">${escapeHtml(t.nextStepsTitle)}</div>
          <div style="font-size:14px;line-height:1.6;color:#374151;">${escapeHtml(t.nextStepsBody)}</div>
        </td>
      </tr>
    </table>

    ${renderOrderEmailCtas({
      orderLookupUrl: input.orderLookupUrl,
      ctaPrimary: t.ctaPrimary,
      profileOrdersUrl: input.profileOrdersUrl,
      ctaSecondary: t.ctaSecondary,
    })}
  `;
}
