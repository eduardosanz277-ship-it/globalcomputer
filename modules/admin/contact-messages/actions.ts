"use server";

import {
  getContactNotificationsAdminService,
  markContactMessageReadAdminService,
} from "./contact-messages.service";
import type { ContactNotificationsPayload } from "./contact-messages.types";

export async function markContactMessageReadAdminAction(id: string) {
  await markContactMessageReadAdminService(id);
}

export async function getContactNotificationsAdminAction(): Promise<ContactNotificationsPayload> {
  return getContactNotificationsAdminService();
}
