import { getAppBaseUrl } from "@/lib/app-url";
import { escapeHtml } from "@/lib/email/escapeHtml";
import {
  EMAIL_BRAND_NAME,
  resolveEmailFrom,
} from "@/lib/email/email-brand";
import { wrapBrandedEmail } from "@/lib/email/templates/brandedEmailShell";

/**
 * Notifica por correo que la cuenta empresa fue aprobada.
 * Requiere `RESEND_API_KEY`. From: `EMAIL_FROM` o el mismo del OTP.
 */
export async function sendBusinessApprovalEmail(
  to: string,
  businessDisplayName: string,
): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = resolveEmailFrom();

  if (!apiKey?.trim()) {
    console.warn(
      "[email] RESEND_API_KEY no configurado; no se envió el correo de aprobación.",
    );
    return { sent: false };
  }

  const appUrl = getAppBaseUrl();
  const brand = EMAIL_BRAND_NAME;
  const safeName = escapeHtml(businessDisplayName.trim() || "tu negocio");
  const subject = "Tu cuenta de empresa ha sido aprobada";
  const bannerSubtitle = "Cuenta de empresa aprobada";

  const bodyHtml = `
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:#4b5563;">Hola,</p>
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:#4b5563;">
      La solicitud de registro de <strong style="color:#0f172a;">${safeName}</strong> ha sido <strong style="color:#0f172a;">aprobada</strong>.
    </p>
    <p style="margin:0 0 24px 0;font-size:15px;line-height:1.65;color:#4b5563;">
      Ya puedes iniciar sesión en ${escapeHtml(brand)} con tu correo (enlace mágico o código).
    </p>
    <div style="text-align:center;">
      <a href="${escapeHtml(`${appUrl}/login`)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;line-height:1;padding:14px 24px;border-radius:8px;">Iniciar sesión</a>
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
      subject,
      html: wrapBrandedEmail({
        locale: "es",
        title: subject,
        bannerSubtitle,
        preheader: `Tu cuenta de empresa en ${brand} fue aprobada.`,
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
