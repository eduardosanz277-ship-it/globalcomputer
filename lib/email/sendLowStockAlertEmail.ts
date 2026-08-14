import { resolveEmailFrom } from "@/lib/email/email-brand";
import { renderLowStockAlertEmailTemplate } from "./templates/lowStockAlertTemplate";

type LowStockAlertInput = {
  to: string;
  productName: string;
  productSku: string;
  stock: number;
  threshold: number;
};

/**
 * Envía alerta de stock bajo al correo de soporte configurado en app_config.
 * Requiere `RESEND_API_KEY`. From: `EMAIL_FROM` o el mismo del OTP.
 */
export async function sendLowStockAlertEmail(
  input: LowStockAlertInput,
): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = resolveEmailFrom();

  if (!apiKey?.trim()) {
    console.warn(
      "[email] RESEND_API_KEY no configurado; no se envió alerta de stock bajo.",
    );
    return { sent: false };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to.trim().toLowerCase()],
      subject: `Alerta de stock bajo: ${input.productName}`,
      html: renderLowStockAlertEmailTemplate(input),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[email] Resend error (low stock):", res.status, body);
    throw new Error("No se pudo enviar la alerta de stock bajo.");
  }

  return { sent: true };
}
