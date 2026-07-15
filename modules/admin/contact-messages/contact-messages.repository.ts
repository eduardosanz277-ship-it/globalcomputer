import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type {
  ContactMessageAdmin,
  ContactMessageNotification,
  ContactNotificationsPayload,
} from "./contact-messages.types";

type ContactMessageRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

type ContactNotificationRow = {
  id: string;
  name: string;
  email: string;
  subject: string;
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
    isRead: Boolean(row.is_read),
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

function mapNotificationRow(
  row: ContactNotificationRow,
): ContactMessageNotification {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    subject: row.subject,
    createdAt: row.created_at,
  };
}

const SELECT_COLUMNS =
  "id, name, email, phone, subject, message, is_read, read_at, created_at";

const NOTIFICATION_SELECT = "id, name, email, subject, created_at";

export async function repoListContactMessagesAdmin(): Promise<
  ContactMessageAdmin[]
> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .select(SELECT_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as ContactMessageRow[]).map(mapRow);
}

export async function repoGetContactNotificationsAdmin(
  limit = 8,
): Promise<ContactNotificationsPayload> {
  const supabase = createSupabaseAdminClient();

  const [countResult, listResult] = await Promise.all([
    supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false),
    supabase
      .from("contact_messages")
      .select(NOTIFICATION_SELECT)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  if (countResult.error) throw countResult.error;
  if (listResult.error) throw listResult.error;

  return {
    unreadCount: countResult.count ?? 0,
    items: ((listResult.data ?? []) as ContactNotificationRow[]).map(
      mapNotificationRow,
    ),
  };
}

export async function repoMarkContactMessageReadAdmin(
  id: string,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("contact_messages")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("is_read", false);

  if (error) throw error;
}
