import type { ContactRequestFormValues } from "./contact-requests.schema";
import { createContactMessage } from "./contact-messages.service";

/**
 * Persiste el envío del formulario de contacto en `contact_messages`.
 */
export async function createContactRequest(
  data: ContactRequestFormValues,
): Promise<void> {
  await createContactMessage({
    name: data.name,
    email: data.email,
    phone: data.phone.trim() ? data.phone.trim() : null,
    subject: data.subject,
    message: data.message,
  });
}
