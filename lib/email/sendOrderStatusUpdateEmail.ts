import { resolveEmailFrom } from "@/lib/email/email-brand";
import {
  renderOrderStatusUpdateEmailSubject,
  renderOrderStatusUpdateEmailTemplate,
  type OrderStatusUpdateTemplateInput,
} from "@/lib/email/templates/orderStatusUpdateTemplate";

/**
 * Avisa al cliente de un cambio de estado del pedido (preparación, envío, completado o cancelado).
 * Requiere `RESEND_API_KEY`. From: `EMAIL_FROM` o el mismo del OTP.
 */
export async function sendOrderStatusUpdateEmail(
  to: string,
  input: OrderStatusUpdateTemplateInput,
  options?: { idempotencyKey?: string },
): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = resolveEmailFrom();

  if (!apiKey?.trim()) {
    console.warn(
      "[email] RESEND_API_KEY no configurado; no se envió aviso de estado de pedido.",
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

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify({
      from,
      to: [to.trim().toLowerCase()],
      subject: renderOrderStatusUpdateEmailSubject(input),
      html: renderOrderStatusUpdateEmailTemplate(input),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[email] Resend error (order status):", res.status, body);
    return { sent: false };
  }

  return { sent: true };
}
