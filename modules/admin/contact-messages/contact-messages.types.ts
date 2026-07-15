export type ContactMessageAdmin = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

export type ContactMessageNotification = {
  id: string;
  name: string;
  email: string;
  subject: string;
  createdAt: string;
};

export type ContactNotificationsPayload = {
  unreadCount: number;
  items: ContactMessageNotification[];
};

/** Evento del cliente para refrescar la campana tras marcar mensajes como leídos. */
export const CONTACT_NOTIFICATIONS_REFRESH_EVENT =
  "gc:contact-notifications-refresh";
