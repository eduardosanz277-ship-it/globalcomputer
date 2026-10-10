import { getBrandedEmailFooterContact } from "@/lib/email/branded-email-contact.server";
import { getAppBaseUrl } from "@/lib/app-url";
import { escapeHtml } from "@/lib/email/escapeHtml";
import {
  EMAIL_BRAND_NAME,
  resolveEmailFrom,
} from "@/lib/email/email-brand";
import { wrapBrandedEmail } from "@/lib/email/templates/brandedEmailShell";
import { resolveAppLocale } from "@/lib/i18n/parse-locale";
import type { Locale } from "@/components/i18n/translations";
import { getPublicSiteContact } from "@/lib/site-contact.server";

export type AdminBusinessPendingRequestInput = {
  businessName: string;
  email: string;
  phone?: string | null;
  employerIdentificationNumber: string;
};

function copy(locale: Locale) {
  if (locale === "en") {
    return {
      subject: "New business account request pending review",
      bannerSubtitle: "Pending business registration",
      preheader: (brand: string) =>
        `A new business account request on ${brand} is waiting for review.`,
      intro: (brand: string) =>
        `A company submitted a registration request on ${brand}. The account is pending and cannot sign in until you approve or reject it.`,
      business: "Business name",
      email: "Email",
      phone: "Phone",
      ein: "EIN",
      missing: "—",
      cta: "Review request",
    };
  }

  return {
    subject: "Nueva solicitud de cuenta empresarial pendiente",
    bannerSubtitle: "Registro de empresa pendiente",
    preheader: (brand: string) =>
      `Hay una nueva solicitud de cuenta empresarial en ${brand} pendiente de revisión.`,
    intro: (brand: string) =>
      `Una empresa envió una solicitud de registro en ${brand}. La cuenta quedó pendiente y no podrá iniciar sesión hasta que la apruebes o la rechaces.`,
    business: "Nombre del negocio",
    email: "Correo",
    phone: "Teléfono",
    ein: "EIN",
    missing: "—",
    cta: "Revisar solicitud",
  };
}

function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:8px 0;font-size:13px;line-height:1.5;color:#6b7280;width:38%;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:8px 0;font-size:15px;line-height:1.5;color:#0f172a;font-weight:600;">${escapeHtml(value)}</td>
    </tr>
  `;
}

/**
 * Avisa al correo de Ajustes (`support_email`) de una solicitud empresa pendiente.
 * El idioma usa ADMIN_LOCALE (por defecto "es").
 */
export async function sendAdminBusinessPendingRequestEmail(
  input: AdminBusinessPendingRequestInput,
): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const contact = await getPublicSiteContact();
  const toEmail = contact.email.trim();

  if (!apiKey || !toEmail) {
    console.warn(
      "[email] admin business pending: RESEND_API_KEY no configurado o falta el email de Ajustes.",
    );
    return { sent: false };
  }

  const locale = resolveAppLocale(process.env.ADMIN_LOCALE) as Locale;
  const t = copy(locale);
  const brand = EMAIL_BRAND_NAME;
  const from = resolveEmailFrom();
  const reviewUrl = `${getAppBaseUrl()}/admin/suscripciones-empresas`;
  const phone = input.phone?.trim() || t.missing;
  const businessName = input.businessName.trim() || t.missing;

  const bodyHtml = `
    <p style="margin:0 0 18px 0;font-size:15px;line-height:1.65;color:#4b5563;">
      ${escapeHtml(t.intro(brand))}
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 24px 0;">
      ${detailRow(t.business, businessName)}
      ${detailRow(t.email, input.email.trim().toLowerCase())}
      ${detailRow(t.phone, phone)}
      ${detailRow(t.ein, input.employerIdentificationNumber.trim())}
    </table>
    <div style="text-align:center;">
      <a href="${escapeHtml(reviewUrl)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;line-height:1;padding:14px 24px;border-radius:8px;">${escapeHtml(t.cta)}</a>
    </div>
  `;

  const footerContact = await getBrandedEmailFooterContact();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [toEmail.toLowerCase()],
      subject: t.subject,
      html: wrapBrandedEmail({
        locale,
        title: t.subject,
        bannerSubtitle: t.bannerSubtitle,
        preheader: t.preheader(brand),
        bodyHtml,
        footerContact,
      }),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(
      "[email] Resend error (admin business pending request):",
      res.status,
      body,
    );
    return { sent: false };
  }

  return { sent: true };
}
