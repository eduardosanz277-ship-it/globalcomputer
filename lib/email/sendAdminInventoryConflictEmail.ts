import { resolveEmailFrom } from "@/lib/email/email-brand";
import {
  renderAdminInventoryConflictEmail,
  renderAdminInventoryConflictEmailSubject,
  type AdminInventoryConflictTemplateInput,
} from "@/lib/email/templates/adminInventoryConflictTemplate";
import { resolveAppLocale } from "@/lib/i18n/parse-locale";
import type { Locale } from "@/components/i18n/translations";
import { getPublicSiteContact } from "@/lib/site-contact.server";

/**
 * Notifica al correo de Ajustes (`support_email` en `/admin/settings`)
 * cuando un pedido no puede descontarse del inventario por falta de stock.
 *
 * Requiere RESEND_API_KEY. El idioma se controla con ADMIN_LOCALE (por defecto "es").
 */
export async function sendAdminInventoryConflictEmail(
  input: Omit<AdminInventoryConflictTemplateInput, "locale">,
): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const contact = await getPublicSiteContact();
  const toEmail = contact.email.trim();

  if (!apiKey || !toEmail) {
    console.warn(
      "[email] admin conflict alert: RESEND_API_KEY no configurado o falta el email de Ajustes.",
    );
    return { sent: false };
  }

  const locale = resolveAppLocale(process.env.ADMIN_LOCALE) as Locale;
  const fullInput: AdminInventoryConflictTemplateInput = { ...input, locale };

  const from = resolveEmailFrom();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [toEmail.toLowerCase()],
      subject: renderAdminInventoryConflictEmailSubject(fullInput),
      html: renderAdminInventoryConflictEmail(fullInput),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[email] Resend error (admin inventory conflict):", res.status, body);
    return { sent: false };
  }

  return { sent: true };
}
