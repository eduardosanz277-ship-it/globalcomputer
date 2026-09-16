import type { Locale } from "@/components/i18n/translations";
import { getBrandedEmailFooterContact } from "@/lib/email/branded-email-contact.server";
import { resolveEmailFrom } from "@/lib/email/email-brand";
import {
  renderLoginOtpEmailSubject,
  renderLoginOtpEmailTemplate,
} from "@/lib/email/templates/loginOtpTemplate";

/**
 * Envía el correo del código de acceso con el locale de la UI.
 * Requiere `RESEND_API_KEY`. Si falta, el login cae en el mailer de Supabase Auth.
 */
export async function sendLoginOtpEmail(input: {
  to: string;
  token: string;
  locale: Locale;
  name?: string | null;
}): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = resolveEmailFrom();
  const to = input.to.trim().toLowerCase();

  if (!apiKey?.trim()) {
    return { sent: false };
  }

  const footerContact = await getBrandedEmailFooterContact();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: renderLoginOtpEmailSubject(input.locale),
      html: renderLoginOtpEmailTemplate({
        locale: input.locale,
        email: to,
        token: input.token,
        name: input.name,
        footerContact,
      }),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[email] Resend error (login OTP):", res.status, body);
    return { sent: false };
  }

  return { sent: true };
}
