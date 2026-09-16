import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import {
  ensureAdminAccess,
  mapAdminEntityDbError,
  resolveAdminLocale,
} from "@/modules/admin/admin-errors";
import {
  repoGetContactNotificationsAdmin,
  repoListContactMessagesAdmin,
  repoMarkContactMessageReadAdmin,
} from "./contact-messages.repository";
import type {
  ContactMessageAdmin,
  ContactNotificationsPayload,
} from "./contact-messages.types";

export async function listContactMessagesAdminService(): Promise<
  ContactMessageAdmin[]
> {
  return repoListContactMessagesAdmin();
}

export async function getContactNotificationsAdminService(
  localeInput?: unknown,
): Promise<ContactNotificationsPayload> {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  return repoGetContactNotificationsAdmin(8);
}

export async function markContactMessageReadAdminService(
  id: string,
  localeInput?: unknown,
): Promise<void> {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  try {
    await repoMarkContactMessageReadAdmin(id);
  } catch (e) {
    throw mapAdminEntityDbError(e, locale, "contacts", "markReadFailed");
  }
}
