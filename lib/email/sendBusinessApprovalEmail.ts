function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Notifica por correo que la cuenta empresa fue aprobada.
 * Requiere `RESEND_API_KEY` y `EMAIL_FROM` (dominio verificado en Resend).
 */
export async function sendBusinessApprovalEmail(
  to: string,
  businessDisplayName: string
): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey?.trim() || !from?.trim()) {
    console.warn(
      "[email] RESEND_API_KEY o EMAIL_FROM no configurados; no se envió el correo de aprobación."
    );
    return { sent: false };
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  const safeName = escapeHtml(businessDisplayName.trim() || "tu negocio");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: from.trim(),
      to: [to.trim().toLowerCase()],
      subject: "Tu cuenta de empresa ha sido aprobada — Global Computer",
      html: `<p>Hola,</p>
<p>La solicitud de registro de <strong>${safeName}</strong> ha sido <strong>aprobada</strong>.</p>
<p>Ya puedes <a href="${escapeHtml(appUrl)}/login">iniciar sesión</a> en Global Computer con tu correo (enlace mágico o código).</p>
<p>Saludos,<br/>Global Computer</p>`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[email] Resend error:", res.status, body);
    throw new Error("No se pudo enviar el correo de notificación. Revisa RESEND_API_KEY y EMAIL_FROM.");
  }

  return { sent: true };
}
