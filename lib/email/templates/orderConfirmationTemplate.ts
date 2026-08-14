import { escapeHtml } from "@/lib/email/escapeHtml";
import { wrapBrandedEmail } from "@/lib/email/templates/brandedEmailShell";

export type OrderConfirmationLineItem = {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type OrderConfirmationTemplateInput = {
  locale: "es" | "en";
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: OrderConfirmationLineItem[];
  amountSubtotal: number;
  amountDiscount: number;
  amountTax: number;
  amountShipping: number;
  totalAmount: number;
  shippingAddressLines: string[];
  orderLookupUrl: string;
  profileOrdersUrl: string;
};

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function copy(locale: "es" | "en") {
  if (locale === "en") {
    return {
      preheader: (orderNumber: string) =>
        `Your order ${orderNumber} is confirmed. We're preparing it for you.`,
      subject: (orderNumber: string) => `Order confirmed — ${orderNumber}`,
      bannerSubtitle: "Order confirmed",
      intro: (name: string) =>
        `Hi ${name}, we've received your payment and your order is confirmed.`,
      orderNumberLabel: "Order number",
      orderDateLabel: "Date",
      summaryTitle: "Order summary",
      qtyLabel: "Qty",
      subtotal: "Subtotal",
      discount: "Discount",
      tax: "Tax",
      shipping: "Shipping",
      total: "Total",
      shippingTitle: "Shipping address",
      nextStepsTitle: "What happens next?",
      nextStepsBody:
        "We'll email you when your order moves to the next stage. You can track status and history anytime with your order number and email.",
      ctaPrimary: "Track my order",
      ctaSecondary: "View in my account",
    };
  }

  return {
    preheader: (orderNumber: string) =>
      `Tu pedido ${orderNumber} está confirmado. Ya estamos preparándolo.`,
    subject: (orderNumber: string) => `Pedido confirmado — ${orderNumber}`,
    bannerSubtitle: "Pedido confirmado",
    intro: (name: string) =>
      `Hola ${name}, hemos recibido tu pago y tu pedido ya está confirmado.`,
    orderNumberLabel: "Nº de pedido",
    orderDateLabel: "Fecha",
    summaryTitle: "Resumen del pedido",
    qtyLabel: "Cant.",
    subtotal: "Subtotal",
    discount: "Descuento",
    tax: "Impuestos",
    shipping: "Envío",
    total: "Total",
    shippingTitle: "Dirección de envío",
    nextStepsTitle: "¿Qué sigue ahora?",
    nextStepsBody:
      "Te avisaremos por correo cuando tu pedido avance al siguiente estado. Puedes consultar el estado y el historial en cualquier momento con tu número de pedido y correo.",
    ctaPrimary: "Consultar mi pedido",
    ctaSecondary: "Ver en mi cuenta",
  };
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
  items: OrderConfirmationLineItem[],
  qtyLabel: string,
): string {
  const rows = items
    .map((item) => {
      const name = escapeHtml(item.productName.trim() || "Producto");
      const qty = String(item.quantity);
      const unit = formatUsd(item.unitPrice);
      const total = formatUsd(item.totalPrice);
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

export function renderOrderConfirmationEmailSubject(
  input: Pick<OrderConfirmationTemplateInput, "locale" | "orderNumber">,
): string {
  return copy(input.locale).subject(input.orderNumber);
}

export function renderOrderConfirmationEmailTemplate(
  input: OrderConfirmationTemplateInput,
): string {
  const t = copy(input.locale);
  const safeOrderNumber = escapeHtml(input.orderNumber);
  const safeDate = escapeHtml(input.orderDate);

  const discountRow =
    input.amountDiscount > 0
      ? moneyRow(t.discount, `−${formatUsd(input.amountDiscount)}`)
      : "";

  const bodyHtml = `
    <p style="margin:0 0 20px 0;font-size:15px;line-height:1.65;color:#4b5563;">${escapeHtml(t.intro(input.customerName.trim() || "Cliente"))}</p>

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
    ${renderItemsTable(input.items, t.qtyLabel)}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:8px;margin-bottom:22px;">
      ${moneyRow(t.subtotal, formatUsd(input.amountSubtotal))}
      ${discountRow}
      ${moneyRow(t.tax, formatUsd(input.amountTax))}
      ${moneyRow(t.shipping, formatUsd(input.amountShipping))}
      <tr><td colspan="2" style="padding-top:8px;border-top:1px solid #e6ebf1;"></td></tr>
      ${moneyRow(t.total, formatUsd(input.totalAmount), { bold: true })}
    </table>

    <div style="font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#6b7280;margin-bottom:10px;">${escapeHtml(t.shippingTitle)}</div>
    <div style="margin-bottom:22px;">${renderAddress(input.shippingAddressLines)}</div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eff6ff;border:1px solid #dbeafe;border-radius:10px;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 18px;">
          <div style="font-size:14px;font-weight:700;color:#1d4ed8;margin-bottom:6px;">${escapeHtml(t.nextStepsTitle)}</div>
          <div style="font-size:14px;line-height:1.6;color:#374151;">${escapeHtml(t.nextStepsBody)}</div>
        </td>
      </tr>
    </table>

    <div style="text-align:center;">
      <a href="${escapeHtml(input.orderLookupUrl)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;line-height:1;padding:14px 24px;border-radius:8px;">${escapeHtml(t.ctaPrimary)}</a>
      <div style="margin-top:14px;">
        <a href="${escapeHtml(input.profileOrdersUrl)}" style="font-size:14px;color:#2563eb;text-decoration:none;font-weight:600;">${escapeHtml(t.ctaSecondary)}</a>
      </div>
    </div>
  `;

  return wrapBrandedEmail({
    locale: input.locale,
    title: t.subject(input.orderNumber),
    bannerSubtitle: t.bannerSubtitle,
    preheader: t.preheader(input.orderNumber),
    bodyHtml,
  });
}
