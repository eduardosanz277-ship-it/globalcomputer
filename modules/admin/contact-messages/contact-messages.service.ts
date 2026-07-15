import { getCurrentUserService } from "@/modules/auth/auth.service";
import type { UserRole } from "@/modules/auth/auth.types";
import {
  repoGetContactNotificationsAdmin,
  repoListContactMessagesAdmin,
  repoMarkContactMessageReadAdmin,
} from "./contact-messages.repository";
import type {
  ContactMessageAdmin,
  ContactNotificationsPayload,
} from "./contact-messages.types";

function ensureAdmin(role?: UserRole) {
  if (role !== "ADMIN") {
    throw new Error("Acceso restringido a administradores");
  }
}

export async function listContactMessagesAdminService(): Promise<
  ContactMessageAdmin[]
> {
  return repoListContactMessagesAdmin();
}

export async function getContactNotificationsAdminService(): Promise<ContactNotificationsPayload> {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  return repoGetContactNotificationsAdmin(8);
}

export async function markContactMessageReadAdminService(
  id: string,
): Promise<void> {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  await repoMarkContactMessageReadAdmin(id);
}
