import { createSupabaseServerClient } from "@/lib/supabaseServer";

export type CreateContactMessagePayload = {
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
};

/**
 * Inserta un mensaje desde el formulario público (RLS: solo INSERT para anon).
 */
export async function createContactMessage(
  payload: CreateContactMessagePayload,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("contact_messages").insert({
    name: payload.name.trim(),
    email: payload.email.trim(),
    phone: payload.phone?.trim() ? payload.phone.trim() : null,
    subject: payload.subject.trim(),
    message: payload.message.trim(),
  });

  if (error) {
    throw error;
  }
}
