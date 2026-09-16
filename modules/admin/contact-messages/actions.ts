"use server";

import {
  getContactNotificationsAdminService,
  markContactMessageReadAdminService,
} from "./contact-messages.service";
import type { ContactNotificationsPayload } from "./contact-messages.types";
import {
  runServerAction,
  type ServerActionResult,
} from "@/lib/errors/run-server-action";
import { resolveAdminLocale } from "@/modules/admin/admin-errors";

export async function markContactMessageReadAdminAction(
  id: string,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.contacts.markReadFailed",
    () => markContactMessageReadAdminService(id, resolvedLocale),
  );
}

export async function getContactNotificationsAdminAction(
  locale?: string,
): Promise<ServerActionResult<ContactNotificationsPayload>> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.common.accessDenied",
    () => getContactNotificationsAdminService(resolvedLocale),
  );
}
