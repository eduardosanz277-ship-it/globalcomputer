import type { Locale } from "@/components/i18n/translations";
import { escapeHtml } from "@/lib/email/escapeHtml";
import { EMAIL_BRAND_NAME } from "@/lib/email/email-brand";
import type { InventoryConflictItem } from "@/modules/commerce/inventory.service";

export type AdminInventoryConflictTemplateInput = {
  locale: Locale;
  orderNumber: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  totalAmount: string;
  conflicts: InventoryConflictItem[];
  adminOrdersUrl: string;
};

function copy(locale: Locale) {
  if (locale === "en") {
    return {
      lang: "en",
      actionRequired: "Action required",
      bannerTitle: "⚠ Inventory conflict",
      alertSystem: "Alert system",
      orderLabel: "Order",
      chargedLabel: "Amount charged",
      customerPrefix: "Customer",
      bodyText:
        "The customer was charged via Stripe but <strong>inventory could not be deducted</strong> because one or more products have insufficient stock. No confirmation email was sent to the customer.",
      conflictsTitle: "Conflicting products",
      colProduct: "Product",
      colSku: "SKU",
      colRequested: "Requested",
      colAvailable: "Available",
      resolutionTitle: "Resolution options",
      resolutionBody:
        "1. <strong>Full refund:</strong> Issue the refund in Stripe and notify the customer.<br/>2. <strong>Restock:</strong> Adjust the product stock and retry the inventory deduction.",
      ctaLabel: "View order in admin panel",
      footer: "Internal automated email — do not reply to this message.",
    };
  }
  return {
    lang: "es",
    actionRequired: "Acción requerida",
    bannerTitle: "⚠ Conflicto de inventario",
    alertSystem: "Sistema de alertas",
    orderLabel: "Pedido",
    chargedLabel: "Total cobrado",
    customerPrefix: "Cliente",
    bodyText:
      "El cliente fue cobrado a través de Stripe pero <strong>no fue posible descontar el inventario</strong> porque uno o más productos no tienen stock suficiente. No se envió correo de confirmación al cliente.",
    conflictsTitle: "Productos en conflicto",
    colProduct: "Producto",
    colSku: "SKU",
    colRequested: "Solicitado",
    colAvailable: "Disponible",
    resolutionTitle: "Opciones de resolución",
    resolutionBody:
      "1. <strong>Reembolso total:</strong> Emite el reembolso en Stripe y notifica al cliente.<br/>2. <strong>Reposición:</strong> Ajusta el stock del producto y reintenta el descuento de inventario.",
    ctaLabel: "Ir al pedido en el panel admin",
    footer: "Correo automático interno — no respondas a este mensaje.",
  };
}

function formatConflictRows(conflicts: InventoryConflictItem[]): string {
  return conflicts
    .map((c) => {
      const displayName = c.product_name
        ? escapeHtml(c.product_name)
        : `<span style="font-family:monospace;font-size:11px;color:#6b7280;">${escapeHtml(c.product_id)}</span>`;
      const displaySku = c.product_sku
        ? `<span style="font-family:monospace;font-size:12px;color:#374151;">${escapeHtml(c.product_sku)}</span>`
        : `<span style="color:#9ca3af;font-size:11px;">—</span>`;
      return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #fde68a;font-size:13px;color:#0f172a;">
          ${displayName}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #fde68a;text-align:center;">
          ${displaySku}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #fde68a;font-size:13px;color:#0f172a;text-align:center;">${c.requested}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #fde68a;font-size:13px;font-weight:700;text-align:center;color:${c.available === 0 ? "#dc2626" : "#d97706"};">${c.available}</td>
      </tr>`;
    })
    .join("");
}

export function renderAdminInventoryConflictEmailSubject(
  input: Pick<AdminInventoryConflictTemplateInput, "locale" | "orderNumber">,
): string {
  const c = copy(input.locale);
  return `${c.bannerTitle} — ${input.orderNumber}`;
}

export function renderAdminInventoryConflictEmail(
  input: AdminInventoryConflictTemplateInput,
): string {
  const c = copy(input.locale);
  const brand = escapeHtml(EMAIL_BRAND_NAME);
  const orderNumber = escapeHtml(input.orderNumber);
  const customerName = escapeHtml(input.customerName || (input.locale === "en" ? "Customer" : "Cliente"));
  const customerEmail = escapeHtml(input.customerEmail);
  const totalAmount = escapeHtml(input.totalAmount);
  const adminUrl = escapeHtml(input.adminOrdersUrl);
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="${c.lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${c.bannerTitle} — ${orderNumber}</title>
  </head>
  <body style="margin:0;background:#f3f4f6;font-family:'Inter',system-ui,-apple-system,sans-serif;color:#0f172a;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 25px 70px rgba(15,23,42,.15);">
            <tr>
              <td align="center" bgcolor="#92400e" style="padding:28px 40px;text-align:center;background-color:#92400e;background:linear-gradient(120deg,#78350f,#d97706);">
                <p style="margin:0 0 6px;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#fde68a;">${escapeHtml(c.actionRequired)}</p>
                <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">${escapeHtml(c.bannerTitle)}</h1>
                <p style="margin:6px 0 0;color:#fef3c7;font-size:13px;">${brand} · ${escapeHtml(c.alertSystem)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 36px;background:#fffbeb;border-bottom:2px solid #fde68a;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#92400e;">${escapeHtml(c.orderLabel)}</td>
                    <td style="font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#92400e;text-align:right;">${escapeHtml(c.chargedLabel)}</td>
                  </tr>
                  <tr>
                    <td style="padding-top:4px;font-size:20px;font-weight:700;color:#0f172a;">${orderNumber}</td>
                    <td style="padding-top:4px;font-size:18px;font-weight:700;color:#0f172a;text-align:right;">${totalAmount}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding-top:8px;font-size:13px;color:#374151;">
                      ${escapeHtml(c.customerPrefix)}: <strong>${customerName}</strong> &lt;${customerEmail}&gt;
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 36px;">
                <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#374151;">
                  ${c.bodyText}
                </p>

                <div style="font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#92400e;margin-bottom:10px;">${escapeHtml(c.conflictsTitle)}</div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #fde68a;border-radius:8px;overflow:hidden;">
                  <thead>
                    <tr style="background:#fef3c7;">
                      <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#92400e;">${escapeHtml(c.colProduct)}</th>
                      <th style="padding:8px 12px;text-align:center;font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#92400e;">${escapeHtml(c.colSku)}</th>
                      <th style="padding:8px 12px;text-align:center;font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#92400e;">${escapeHtml(c.colRequested)}</th>
                      <th style="padding:8px 12px;text-align:center;font-size:11px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#92400e;">${escapeHtml(c.colAvailable)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${formatConflictRows(input.conflicts)}
                  </tbody>
                </table>

                <div style="margin:24px 0;padding:16px 18px;border-radius:12px;background:#fef9c3;border:1px solid #fde047;">
                  <p style="margin:0;font-size:13px;font-weight:700;color:#713f12;margin-bottom:6px;">${escapeHtml(c.resolutionTitle)}</p>
                  <p style="margin:0;font-size:13px;line-height:1.6;color:#374151;">
                    ${c.resolutionBody}
                  </p>
                </div>

                <div style="text-align:center;margin-top:8px;">
                  <a href="${adminUrl}" style="display:inline-block;padding:12px 28px;border-radius:8px;background:#d97706;color:#fff;font-size:14px;font-weight:600;text-decoration:none;">
                    ${escapeHtml(c.ctaLabel)}
                  </a>
                </div>
              </td>
            </tr>
            <tr>
              <td align="center" bgcolor="#0f172a" style="padding:20px 40px;background:#0f172a;border-top:1px solid #1e293b;text-align:center;">
                <p style="margin:0;color:#94a3b8;font-size:12px;">© ${year} ${brand} · ${escapeHtml(c.footer)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
