import { escapeHtml } from "@/lib/email/escapeHtml";
import { wrapBrandedEmail } from "@/lib/email/templates/brandedEmailShell";
import { renderOrderEmailCtas } from "@/lib/email/templates/orderEmailBlocks";
import type { OrderConfirmationLineItem } from "@/lib/email/templates/orderConfirmationTemplate";

export type ManualQuoteRequestTemplateInput = {
  locale: "es" | "en";
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: OrderConfirmationLineItem[];
  amountSubtotal: number;
  amountDiscount: number;
  merchandiseTotal: number;
  shippingAddressLines: string[];
  orderLookupUrl: string;
  profileOrdersUrl?: string | null;
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
        `We received your quote request ${orderNumber}. We'll contact you about shipping soon.`,
      subject: (orderNumber: string) =>
        `Quote request received — ${orderNumber}`,
      bannerSubtitle: "Quote request received",
      intro: (name: string) =>
        `Hi ${name}, we registered your order and will send you a shipping quote shortly.`,
      orderNumberLabel: "Order number",
      orderDateLabel: "Date",
      summaryTitle: "Requested items",
      qtyLabel: "Qty",
      subtotal: "Subtotal",
      discount: "Discount",
      merchandiseTotal: "Merchandise total",
      shippingNote:
        "Shipping cost is not included yet. An advisor will contact you with the quote.",
      shippingTitle: "Shipping address",
      nextStepsTitle: "What happens next?",
      nextStepsBody:
        "Our team will review your order and reach out via WhatsApp or email with the shipping cost. You can track this request anytime with your order number and email.",
      ctaPrimary: "Track my request",
      ctaSecondary: "View in my account",
    };
  }

  return {
    preheader: (orderNumber: string) =>
      `Recibimos tu solicitud de cotización ${orderNumber}. Pronto te contactaremos sobre el envío.`,
    subject: (orderNumber: string) =>
      `Solicitud de cotización recibida — ${orderNumber}`,
    bannerSubtitle: "Solicitud de cotización recibida",
    intro: (name: string) =>
      `Hola ${name}, registramos tu pedido y en breve te enviaremos la cotización de envío.`,
    orderNumberLabel: "Nº de pedido",
    orderDateLabel: "Fecha",
    summaryTitle: "Productos solicitados",
    qtyLabel: "Cant.",
    subtotal: "Subtotal",
    discount: "Descuento",
    merchandiseTotal: "Total mercancía",
    shippingNote:
      "El costo de envío aún no está incluido. Un asesor te contactará con la cotización.",
    shippingTitle: "Dirección de envío",
    nextStepsTitle: "¿Qué sigue ahora?",
    nextStepsBody:
      "Nuestro equipo revisará tu pedido y se comunicará contigo por WhatsApp o correo con el costo de envío. Puedes consultar el estado de esta solicitud en cualquier momento con tu número de pedido y correo.",
    ctaPrimary: "Consultar mi solicitud",
    ctaSecondary: "Ver en mi cuenta",
  };
}

function renderItemsTable(
  items: OrderConfirmationLineItem[],
  qtyLabel: string,
): string {
  return items
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

export function renderManualQuoteRequestEmailSubject(
  input: Pick<ManualQuoteRequestTemplateInput, "locale" | "orderNumber">,
): string {
  return copy(input.locale).subject(input.orderNumber);
}

export function renderManualQuoteRequestEmailTemplate(
  input: ManualQuoteRequestTemplateInput,
): string {
  const t = copy(input.locale);
  const safeOrderNumber = escapeHtml(input.orderNumber);
  const safeDate = escapeHtml(input.orderDate);

  const discountRow =
    input.amountDiscount > 0
      ? `<tr>
          <td style="padding:6px 0;font-size:14px;color:#6b7280;">${escapeHtml(t.discount)}</td>
          <td style="padding:6px 0;font-size:14px;font-weight:600;color:#374151;text-align:right;">−${escapeHtml(formatUsd(input.amountDiscount))}</td>
        </tr>`
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
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      ${renderItemsTable(input.items, t.qtyLabel)}
    </table>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:8px;margin-bottom:12px;">
      <tr>
        <td style="padding:6px 0;font-size:14px;color:#6b7280;">${escapeHtml(t.subtotal)}</td>
        <td style="padding:6px 0;font-size:14px;font-weight:600;color:#374151;text-align:right;">${escapeHtml(formatUsd(input.amountSubtotal))}</td>
      </tr>
      ${discountRow}
      <tr><td colspan="2" style="padding-top:8px;border-top:1px solid #e6ebf1;"></td></tr>
      <tr>
        <td style="padding:6px 0;font-size:16px;font-weight:700;color:#0f172a;">${escapeHtml(t.merchandiseTotal)}</td>
        <td style="padding:6px 0;font-size:16px;font-weight:700;color:#0f172a;text-align:right;">${escapeHtml(formatUsd(input.merchandiseTotal))}</td>
      </tr>
    </table>
    <p style="margin:0 0 22px 0;font-size:13px;line-height:1.6;color:#6b7280;">${escapeHtml(t.shippingNote)}</p>

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

  return wrapBrandedEmail({
    locale: input.locale,
    title: t.subject(input.orderNumber),
    bannerSubtitle: t.bannerSubtitle,
    preheader: t.preheader(input.orderNumber),
    bodyHtml,
  });
}
