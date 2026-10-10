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
      subject: "Recibimos tu solicitud de cuenta empresarial",
      bannerSubtitle: "Solicitud pendiente de revisión",
      preheader: (brand: string) =>
        `Tu solicitud de cuenta empresarial en ${brand} quedó pendiente de revisión.`,
      hello: "Hola,",
      fallbackName: "tu negocio",
      receivedHtml: (safeName: string, brand: string) =>
        `Recibimos la solicitud de registro de <strong style="color:#0f172a;">${safeName}</strong> en ${escapeHtml(brand)}.`,
      pending:
        "Quedó en estado pendiente. Nuestro equipo revisará los datos de tu empresa antes de habilitar el acceso.",
      noLogin:
        "Todavía no puedes iniciar sesión. Te escribiremos de nuevo a este correo cuando la cuenta sea aprobada o si necesitamos más información.",
      thanks: "Gracias por registrarte.",
    };
  }

  return {
    subject: "We received your business account request",
    bannerSubtitle: "Request pending review",
    preheader: (brand: string) =>
      `Your business account request on ${brand} is pending review.`,
    hello: "Hi,",
    fallbackName: "your business",
    receivedHtml: (safeName: string, brand: string) =>
      `We received the registration request for <strong style="color:#0f172a;">${safeName}</strong> on ${escapeHtml(brand)}.`,
    pending:
      "It is now pending review. Our team will check your business details before enabling access.",
    noLogin:
      "You cannot sign in yet. We will email you again at this address when the account is approved, or if we need more information.",
    thanks: "Thank you for registering.",
  };
}

/**
 * Confirma al solicitante que la cuenta empresa quedó pendiente de aprobación.
 * Requiere `RESEND_API_KEY`. From: `EMAIL_FROM` o el mismo del OTP.
 */
export async function sendBusinessPendingRequestEmail(
  to: string,
  businessDisplayName: string,
  localeInput?: EmailLocale | string | null,
): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = resolveEmailFrom();

  if (!apiKey?.trim()) {
    console.warn(
      "[email] RESEND_API_KEY no configurado; no se envió el correo de solicitud pendiente.",
    );
    return { sent: false };
  }

  const locale = recognizedEmailLocale(localeInput) ?? EMAIL_DEFAULT_LOCALE;
  const t = copy(locale);
  const brand = EMAIL_BRAND_NAME;
  const safeName = escapeHtml(businessDisplayName.trim() || t.fallbackName);

  const bodyHtml = `
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:#4b5563;">${escapeHtml(t.hello)}</p>
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:#4b5563;">
      ${t.receivedHtml(safeName, brand)}
    </p>
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:#4b5563;">
      ${escapeHtml(t.pending)}
    </p>
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:#4b5563;">
      ${escapeHtml(t.noLogin)}
    </p>
    <p style="margin:0;font-size:15px;line-height:1.65;color:#4b5563;">
      ${escapeHtml(t.thanks)}
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
    console.error("[email] Resend error (business pending request):", res.status, body);
    throw new Error(
      "No se pudo enviar el correo de notificación. Revisa RESEND_API_KEY y el remitente.",
    );
  }

  return { sent: true };
}
