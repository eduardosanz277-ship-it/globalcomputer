import type { Locale } from "@/components/i18n/translations";
import { escapeHtml } from "@/lib/email/escapeHtml";
import { EMAIL_BRAND_NAME } from "@/lib/email/email-brand";
import { wrapBrandedEmail } from "@/lib/email/templates/brandedEmailShell";

export type CustomerInventoryConflictTemplateInput = {
  locale: Locale;
  customerName: string;
  orderNumber: string;
  totalAmount: string;
  orderLookupUrl: string;
};

function copy(locale: Locale) {
  const brand = EMAIL_BRAND_NAME;
  if (locale === "en") {
    return {
      subject: (orderNumber: string) => `Update on your order ${orderNumber}`,
      bannerSubtitle: "Important update about your order",
      preheader: (orderNumber: string) =>
        `Your order ${orderNumber} — we're sorry, one of the products is unavailable.`,
      intro: (name: string) => `Hi ${name},`,
      body1: `We sincerely apologize for the inconvenience. Unfortunately, one or more products in your order could not be fulfilled because they went out of stock between the time you placed your order and when we processed it.`,
      body2: (total: string) =>
        `We have issued a <strong>full refund of ${total}</strong> to your original payment method. Depending on your bank, this may take <strong>5 to 10 business days</strong> to appear.`,
      body3: `You do not need to take any action. If you have questions or would like to reorder, please contact us — we'll be happy to help.`,
      ctaLabel: "Check order status",
      closing: `Thank you for your understanding,<br/><strong>${brand} Team</strong>`,
    };
  }
  return {
    subject: (orderNumber: string) => `Actualización de tu pedido ${orderNumber}`,
    bannerSubtitle: "Información importante sobre tu pedido",
    preheader: (orderNumber: string) =>
      `Tu pedido ${orderNumber} — lo sentimos, uno de los productos no está disponible.`,
    intro: (name: string) => `Hola ${name},`,
    body1: `Lamentamos el inconveniente. Desafortunadamente, uno o más productos de tu pedido no pudieron ser procesados porque el inventario se agotó entre el momento en que realizaste la compra y cuando procesamos tu pedido.`,
    body2: (total: string) =>
      `Hemos emitido un <strong>reembolso total de ${total}</strong> al método de pago original. Dependiendo de tu banco, puede tomar entre <strong>5 y 10 días hábiles</strong> en reflejarse.`,
    body3: `No necesitas hacer ninguna acción. Si tienes preguntas o deseas realizar el pedido nuevamente, no dudes en contactarnos.`,
    ctaLabel: "Consultar estado del pedido",
    closing: `Gracias por tu comprensión,<br/><strong>Equipo de ${brand}</strong>`,
  };
}

export function renderCustomerInventoryConflictEmailSubject(
  input: Pick<CustomerInventoryConflictTemplateInput, "locale" | "orderNumber">,
): string {
  return copy(input.locale).subject(input.orderNumber);
}

export function renderCustomerInventoryConflictEmailTemplate(
  input: CustomerInventoryConflictTemplateInput,
): string {
  const t = copy(input.locale);
  const safeName = escapeHtml(input.customerName.trim() || "Cliente");
  const safeOrderNumber = escapeHtml(input.orderNumber);
  const safeTotal = escapeHtml(input.totalAmount);
  const safeUrl = escapeHtml(input.orderLookupUrl);

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#374151;">
      ${escapeHtml(t.intro(safeName))}
    </p>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#374151;">
      ${t.body1}
    </p>
    <div style="margin:20px 0;padding:16px 18px;border-radius:12px;background:#fef9c3;border:1px solid #fde047;">
      <p style="margin:0;font-size:14px;line-height:1.6;color:#374151;">
        ${t.body2(safeTotal)}
      </p>
    </div>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.65;color:#374151;">
      ${t.body3}
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${safeUrl}" style="display:inline-block;padding:12px 28px;border-radius:8px;background:#0f172a;color:#fff;font-size:14px;font-weight:600;text-decoration:none;">
        ${escapeHtml(t.ctaLabel)}
      </a>
    </div>
    <p style="margin:20px 0 0;font-size:14px;line-height:1.65;color:#374151;">
      ${t.closing}
    </p>
    <p style="margin:6px 0 0;font-size:12px;color:#94a3b8;">
      ${escapeHtml(input.locale === "en" ? `Order: ${safeOrderNumber}` : `Pedido: ${safeOrderNumber}`)}
    </p>
  `;

  return wrapBrandedEmail({
    locale: input.locale,
    title: t.subject(input.orderNumber),
    bannerSubtitle: t.bannerSubtitle,
    preheader: t.preheader(input.orderNumber),
    bodyHtml,
  });
}
