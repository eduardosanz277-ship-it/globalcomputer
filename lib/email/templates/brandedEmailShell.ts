import { escapeHtml } from "@/lib/email/escapeHtml";
import { EMAIL_BRAND_NAME } from "@/lib/email/email-brand";
import {
  SITE_CONTACT_EMAIL,
  SITE_CONTACT_PHONE_DISPLAY,
  SITE_CONTACT_PHONE_TEL,
} from "@/lib/site";

export type BrandedEmailFooterContact = {
  supportEmail: string;
  phoneDisplay: string;
  phoneTel: string;
};

function resolveFooterContact(
  contact?: Partial<BrandedEmailFooterContact>,
): BrandedEmailFooterContact {
  return {
    supportEmail: contact?.supportEmail?.trim() || SITE_CONTACT_EMAIL,
    phoneDisplay: contact?.phoneDisplay?.trim() || SITE_CONTACT_PHONE_DISPLAY,
    phoneTel: contact?.phoneTel?.trim() || SITE_CONTACT_PHONE_TEL,
  };
}

/**
 * Envoltorio alineado píxel a píxel con la plantilla OTP de Supabase:
 * banner `linear-gradient(120deg,#111827,#0ea5e9)` + footer `#0f172a`.
 */
export function wrapBrandedEmail(input: {
  locale: "es" | "en";
  /** Título del documento / pestaña. */
  title: string;
  /** Segunda línea del banner (ej. «Pedido confirmado»). */
  bannerSubtitle: string;
  preheader?: string;
  bodyHtml: string;
  /** Si no se pasa, usa `app_config` vía el sender o los fallbacks de `lib/site`. */
  footerContact?: Partial<BrandedEmailFooterContact>;
}): string {
  const brand = escapeHtml(EMAIL_BRAND_NAME);
  const title = escapeHtml(input.title);
  const bannerSubtitle = escapeHtml(input.bannerSubtitle);
  const preheader = escapeHtml(input.preheader ?? "");
  const footer = resolveFooterContact(input.footerContact);
  const supportEmail = escapeHtml(footer.supportEmail);
  const phoneDisplay = escapeHtml(footer.phoneDisplay);
  const phoneTel = escapeHtml(footer.phoneTel);

  const year = new Date().getFullYear();
  const helpHeading =
    input.locale === "en" ? "Need help?" : "¿Necesitas ayuda?";
  const writeUs =
    input.locale === "en" ? "Write to us at" : "Escríbenos a";
  const callUs =
    input.locale === "en" ? "Call us at" : "Llámanos al";

  return `<!DOCTYPE html>
<html lang="${input.locale}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no" />
    <title>${title}</title>
  </head>
  <body style="margin:0;background:#f3f4f6;font-family:'Inter',system-ui,-apple-system,sans-serif;color:#0f172a;">
    ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${preheader}</div>` : ""}
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 25px 70px rgba(15,23,42,.15);">
            <!-- Banner (mismo degradado que el OTP de Supabase) -->
            <tr>
              <td align="center" bgcolor="#111827" style="padding:36px 40px;text-align:center;background-color:#111827;background:linear-gradient(120deg,#111827,#0ea5e9);">
                <h1 style="margin:0;color:#fff;font-size:26px;font-weight:600;">${brand}</h1>
                <p style="margin:6px 0 0;color:#e0e7ff;font-size:14px;">${bannerSubtitle}</p>
              </td>
            </tr>
            <!-- Contenido -->
            <tr>
              <td style="padding:32px 40px;background:#fff;">
                ${input.bodyHtml}
              </td>
            </tr>
            <!-- Footer oscuro (mismo estilo OTP + teléfono) -->
            <tr>
              <td align="center" bgcolor="#0f172a" style="padding:24px 40px;background:#0f172a;border-top:1px solid #1e293b;text-align:center;">
                <p style="margin:0;color:#e2e8f0;font-size:12px;font-weight:600;line-height:1.5;">${escapeHtml(helpHeading)}</p>
                <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;line-height:1.5;">
                  ${escapeHtml(writeUs)} <a href="mailto:${supportEmail}" style="color:#38bdf8;text-decoration:none;">${supportEmail}</a>
                </p>
                <p style="margin:4px 0 0;color:#94a3b8;font-size:12px;line-height:1.5;">
                  ${escapeHtml(callUs)} <a href="tel:${phoneTel}" style="color:#38bdf8;text-decoration:none;">${phoneDisplay}</a>
                </p>
                <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;">© ${year} ${brand}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
