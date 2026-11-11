import type { ContactRequestFormValues } from "./contact-requests.schema";
import { createContactMessage } from "./contact-messages.service";

/**
 * Persiste el envío del formulario de contacto en `contact_messages`.
 */
export async function createContactRequest(
  data: ContactRequestFormValues,
  options?: { isSpam?: boolean; spamReason?: string },
): Promise<void> {
  await createContactMessage({
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    subject: data.subject,
    message: data.message,
    smsConsent: data.sms_consent ?? false,
    isSpam: options?.isSpam ?? false,
    spamReason: options?.spamReason ?? null,
  });
}
