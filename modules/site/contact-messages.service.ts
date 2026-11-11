import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export type CreateContactMessagePayload = {
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  /** Consentimiento explícito para recibir SMS. */
  smsConsent?: boolean;
  /** Marcado interno para bots/spam (honeypot, patrones, etc.). */
  isSpam?: boolean;
  spamReason?: string | null;
};

/**
 * Inserta un mensaje desde el formulario público (solo service role).
 */
export async function createContactMessage(
  payload: CreateContactMessagePayload,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("contact_messages").insert({
    name: payload.name.trim(),
    email: payload.email.trim(),
    phone: payload.phone?.trim() ? payload.phone.trim() : null,
    subject: payload.subject.trim(),
    message: payload.message.trim(),
    sms_consent: Boolean(payload.smsConsent),
    is_spam: Boolean(payload.isSpam),
    spam_reason: payload.spamReason?.trim() || null,
  });

  if (error) {
    throw error;
  }
}
