import { getBrandedEmailFooterContact } from "@/lib/email/branded-email-contact.server";
import { escapeHtml } from "@/lib/email/escapeHtml";
import {
  EMAIL_BRAND_NAME,
  resolveEmailFrom,
} from "@/lib/email/email-brand";
import {
  EMAIL_DEFAULT_LOCALE,
  recognizedEmailLocale,
  type EmailLocale,
} from "@/lib/email/order-confirmation-locale";
import { wrapBrandedEmail } from "@/lib/email/templates/brandedEmailShell";

function copy(locale: EmailLocale) {
  if (locale === "es") {
    return {
      subject: "Actualización sobre tu solicitud de cuenta empresarial",
      bannerSubtitle: "Tu solicitud de cuenta empresarial no ha sido aprobada",
      preheader: (brand: string) =>
        `Actualización sobre tu solicitud de cuenta empresarial en ${brand}.`,
      reviewed:
        "Hemos revisado la información proporcionada y, en esta ocasión, no ha sido posible aprobar tu solicitud de cuenta empresarial.",
      support:
        "Si consideras que se trata de un error o deseas obtener más información, puedes ponerte en contacto con nuestro equipo de soporte.",
      thanks: (brand: string) =>
        `Gracias por tu interés en ${brand}.`,
    };
  }

  return {
    subject: "Update on your business account request",
    bannerSubtitle: "Your business account request has not been approved",
    preheader: (brand: string) =>
      `Update on your business account request at ${brand}.`,
    reviewed:
      "We have reviewed the information provided and, on this occasion, we were unable to approve your business account request.",
    support:
      "If you believe this is an error or would like more information, please contact our support team.",
    thanks: (brand: string) => `Thank you for your interest in ${brand}.`,
  };
}

/**
 * Notifica por correo que la solicitud de cuenta empresarial fue rechazada.
 * Requiere `RESEND_API_KEY`. From: `EMAIL_FROM` o el mismo del OTP.
 */
export async function sendBusinessRejectionEmail(
  to: string,
  localeInput?: EmailLocale | string | null,
): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = resolveEmailFrom();

  if (!apiKey?.trim()) {
    console.warn(
      "[email] RESEND_API_KEY no configurado; no se envió el correo de rechazo.",
    );
    return { sent: false };
  }

  const locale = recognizedEmailLocale(localeInput) ?? EMAIL_DEFAULT_LOCALE;
  const t = copy(locale);
  const brand = EMAIL_BRAND_NAME;

  const bodyHtml = `
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:#4b5563;">
      ${escapeHtml(t.reviewed)}
    </p>
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:#4b5563;">
      ${escapeHtml(t.support)}
    </p>
    <p style="margin:0;font-size:15px;line-height:1.65;color:#4b5563;">
      ${escapeHtml(t.thanks(brand))}
    </p>
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
      to: [to.trim().toLowerCase()],
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
    console.error("[email] Resend error (business rejection):", res.status, body);
    throw new Error(
      "No se pudo enviar el correo de notificación. Revisa RESEND_API_KEY y el remitente.",
    );
  }

  return { sent: true };
}
