import type { Locale } from "@/components/i18n/translations";
import { escapeHtml } from "@/lib/email/escapeHtml";
import { EMAIL_BRAND_NAME } from "@/lib/email/email-brand";
import { wrapBrandedEmail } from "@/lib/email/templates/brandedEmailShell";

export type LoginOtpTemplateInput = {
  locale: Locale;
  email: string;
  token: string;
};

function copy(locale: Locale) {
  const brand = EMAIL_BRAND_NAME;
  if (locale === "en") {
    return {
      subject: "Your access code",
      bannerSubtitle: "Your secure access code",
      preheader: `Your ${brand} access code`,
      intro: (safeEmail: string) =>
        `Hi ${safeEmail}, to continue on ${brand} enter the following code. It is valid for <strong>1 hour</strong>.`,
      ignore:
        "If you didn't request this code, ignore this email. Never share your code with anyone.",
    };
  }

  return {
    subject: "Tu código de acceso",
    bannerSubtitle: "Tu código de acceso seguro",
    preheader: `Tu código de acceso de ${brand}`,
    intro: (safeEmail: string) =>
      `Hola ${safeEmail}, para continuar en ${brand} introduce el siguiente código. Tiene una validez de <strong>1 hora</strong>.`,
    ignore:
      "Si no solicitaste este código, ignora este correo. Nunca compartas tu código con nadie.",
  };
}

export function renderLoginOtpEmailSubject(locale: Locale): string {
  return copy(locale).subject;
}

export function renderLoginOtpEmailTemplate(
  input: LoginOtpTemplateInput,
): string {
  const t = copy(input.locale);
  const safeEmail = escapeHtml(input.email.trim().toLowerCase());
  const safeToken = escapeHtml(input.token.trim());

  const bodyHtml = `
    <p style="margin:0 0 16px;color:#475569;font-size:16px;line-height:1.6;">
      ${t.intro(safeEmail)}
    </p>
    <div style="margin:24px 0;padding:22px 18px;border-radius:18px;background:#0f172a;text-align:center;">
      <p style="margin:0;font-size:22px;letter-spacing:6px;font-weight:700;color:#fff;">${safeToken}</p>
    </div>
    <p style="margin:0;color:#64748b;font-size:14px;line-height:1.5;">
      ${escapeHtml(t.ignore)}
    </p>
  `;

  return wrapBrandedEmail({
    locale: input.locale,
    title: t.subject,
    bannerSubtitle: t.bannerSubtitle,
    preheader: t.preheader,
    bodyHtml,
  });
}
