import { getBrandedEmailFooterContact } from "@/lib/email/branded-email-contact.server";
import { resolveEmailFrom } from "@/lib/email/email-brand";
import {
  renderManualQuoteRequestEmailSubject,
  renderManualQuoteRequestEmailTemplate,
  type ManualQuoteRequestTemplateInput,
} from "@/lib/email/templates/manualQuoteRequestTemplate";

/**
 * Notifica al cliente que se recibió su solicitud de cotización (envío manual).
 * Requiere `RESEND_API_KEY`. From: `EMAIL_FROM` o el mismo del OTP.
 */
export async function sendManualQuoteRequestEmail(
  to: string,
  input: ManualQuoteRequestTemplateInput,
): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = resolveEmailFrom();

  if (!apiKey?.trim()) {
    console.warn(
      "[email] RESEND_API_KEY no configurado; no se envió aviso de cotización.",
    );
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
      to: [to.trim().toLowerCase()],
      subject: renderManualQuoteRequestEmailSubject(input),
      html: renderManualQuoteRequestEmailTemplate({ ...input, footerContact }),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[email] Resend error (manual quote):", res.status, body);
    return { sent: false };
  }

  return { sent: true };
}
