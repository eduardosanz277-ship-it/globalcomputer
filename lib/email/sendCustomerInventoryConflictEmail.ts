import { getBrandedEmailFooterContact } from "@/lib/email/branded-email-contact.server";
import { resolveEmailFrom } from "@/lib/email/email-brand";
import {
  renderCustomerInventoryConflictEmailSubject,
  renderCustomerInventoryConflictEmailTemplate,
  type CustomerInventoryConflictTemplateInput,
} from "@/lib/email/templates/customerInventoryConflictTemplate";

/**
 * Notifica al cliente que su pedido fue reembolsado por conflicto de inventario.
 * Llamado desde el flujo de reembolso del admin.
 */
export async function sendCustomerInventoryConflictEmail(
  to: string,
  input: CustomerInventoryConflictTemplateInput,
): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    console.warn("[email] customer conflict: RESEND_API_KEY no configurado.");
    return { sent: false };
  }

  const from = resolveEmailFrom();
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
      subject: renderCustomerInventoryConflictEmailSubject(input),
      html: renderCustomerInventoryConflictEmailTemplate({
        ...input,
        footerContact,
      }),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[email] Resend error (customer inventory conflict):", res.status, body);
    return { sent: false };
  }

  return { sent: true };
}
