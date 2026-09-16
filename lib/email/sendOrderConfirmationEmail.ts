import { getBrandedEmailFooterContact } from "@/lib/email/branded-email-contact.server";
import { resolveEmailFrom } from "@/lib/email/email-brand";
import {
  renderOrderConfirmationEmailSubject,
  renderOrderConfirmationEmailTemplate,
  type OrderConfirmationTemplateInput,
} from "@/lib/email/templates/orderConfirmationTemplate";

/**
 * Envía la confirmación de compra al cliente.
 * Requiere `RESEND_API_KEY`. From: `EMAIL_FROM` o el mismo del OTP.
 */
export async function sendOrderConfirmationEmail(
  to: string,
  input: OrderConfirmationTemplateInput,
  options?: { idempotencyKey?: string },
): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = resolveEmailFrom();

  if (!apiKey?.trim()) {
    console.warn(
      "[email] RESEND_API_KEY no configurado; no se envió confirmación de pedido.",
    );
    return { sent: false };
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  const idempotencyKey = options?.idempotencyKey?.trim();
  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey.slice(0, 256);
  }

  const footerContact = await getBrandedEmailFooterContact();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify({
      from,
      to: [to.trim().toLowerCase()],
      subject: renderOrderConfirmationEmailSubject(input),
      html: renderOrderConfirmationEmailTemplate({ ...input, footerContact }),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[email] Resend error (order confirmation):", res.status, body);
    return { sent: false };
  }

  return { sent: true };
}
