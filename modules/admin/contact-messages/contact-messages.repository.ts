import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { ContactMessageAdmin } from "./contact-messages.types";

type ContactMessageRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  created_at: string;
};

function mapRow(row: ContactMessageRow): ContactMessageAdmin {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    createdAt: row.created_at,
  };
}

export async function repoListContactMessagesAdmin(): Promise<
  ContactMessageAdmin[]
> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("id, name, email, phone, subject, message, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as ContactMessageRow[]).map(mapRow);
}
