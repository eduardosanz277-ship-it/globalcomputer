import { getAppBaseUrl } from "@/lib/app-url";
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
      subject: "Tu cuenta de empresa ha sido aprobada",
      bannerSubtitle: "Cuenta de empresa aprobada",
      preheader: (brand: string) =>
        `Tu cuenta de empresa en ${brand} fue aprobada.`,
      hello: "Hola,",
      fallbackName: "tu negocio",
      approvedHtml: (safeName: string) =>
        `La solicitud de registro de <strong style="color:#0f172a;">${safeName}</strong> ha sido <strong style="color:#0f172a;">aprobada</strong>.`,
      loginHint: (brand: string) =>
        `Ya puedes iniciar sesión en ${brand}. Solicita un código de acceso con tu correo para ingresar.`,
      cta: "Iniciar sesión",
    };
  }

  return {
    subject: "Your business account has been approved",
    bannerSubtitle: "Business account approved",
    preheader: (brand: string) =>
      `Your business account on ${brand} has been approved.`,
    hello: "Hi,",
    fallbackName: "your business",
    approvedHtml: (safeName: string) =>
      `The registration request for <strong style="color:#0f172a;">${safeName}</strong> has been <strong style="color:#0f172a;">approved</strong>.`,
    loginHint: (brand: string) =>
      `You can now sign in to ${brand}. Request an access code using your email to log in.`,
    cta: "Sign in",
  };
}

/**
 * Notifica por correo que la cuenta empresa fue aprobada.
 * Requiere `RESEND_API_KEY`. From: `EMAIL_FROM` o el mismo del OTP.
 */
export async function sendBusinessApprovalEmail(
  to: string,
  businessDisplayName: string,
  localeInput?: EmailLocale | string | null,
): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = resolveEmailFrom();

  if (!apiKey?.trim()) {
    console.warn(
      "[email] RESEND_API_KEY no configurado; no se envió el correo de aprobación.",
    );
    return { sent: false };
  }

  const locale = recognizedEmailLocale(localeInput) ?? EMAIL_DEFAULT_LOCALE;
  const t = copy(locale);
  const appUrl = getAppBaseUrl();
  const brand = EMAIL_BRAND_NAME;
  const safeName = escapeHtml(
    businessDisplayName.trim() || t.fallbackName,
  );

  const bodyHtml = `
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:#4b5563;">${escapeHtml(t.hello)}</p>
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:#4b5563;">
      ${t.approvedHtml(safeName)}
    </p>
    <p style="margin:0 0 24px 0;font-size:15px;line-height:1.65;color:#4b5563;">
      ${escapeHtml(t.loginHint(brand))}
    </p>
    <div style="text-align:center;">
      <a href="${escapeHtml(`${appUrl}/login`)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;line-height:1;padding:14px 24px;border-radius:8px;">${escapeHtml(t.cta)}</a>
    </div>
  `;

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
      }),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[email] Resend error:", res.status, body);
    throw new Error(
      "No se pudo enviar el correo de notificación. Revisa RESEND_API_KEY y el remitente.",
    );
  }

  return { sent: true };
}
