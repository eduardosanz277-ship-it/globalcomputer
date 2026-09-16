import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import {
  adminInvalidDataError,
  ensureAdminAccess,
  mapAdminEntityDbError,
  resolveAdminLocale,
} from "@/modules/admin/admin-errors";
import { faqFormSchema } from "./faqs.schema";
import {
  repoCreateFaqAdmin,
  repoDeleteFaqAdmin,
  repoListAllFaqsAdmin,
  repoUpdateFaqAdmin,
} from "./faqs.repository";
import type { FaqAdminInsert, FaqAdminUpdate } from "./faqs.types";

export async function getAllFaqsAdminService() {
  const locale = await resolveAdminLocale();
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  return repoListAllFaqsAdmin();
}

export async function createFaqAdminService(
  payload: FaqAdminInsert,
  localeInput?: unknown,
) {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  const parsed = faqFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw adminInvalidDataError(locale, parsed.error.errors[0]?.message);
  }
  try {
    return await repoCreateFaqAdmin(parsed.data);
  } catch (e) {
    throw mapAdminEntityDbError(e, locale, "faqs", "createFailed");
  }
}

export async function updateFaqAdminService(
  id: string,
  payload: FaqAdminUpdate,
  localeInput?: unknown,
) {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  const parsed = faqFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw adminInvalidDataError(locale, parsed.error.errors[0]?.message);
  }
  try {
    await repoUpdateFaqAdmin(id, parsed.data);
  } catch (e) {
    throw mapAdminEntityDbError(e, locale, "faqs", "updateFailed");
  }
}

export async function deleteFaqAdminService(id: string, localeInput?: unknown) {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  try {
    await repoDeleteFaqAdmin(id);
  } catch (e) {
    throw mapAdminEntityDbError(e, locale, "faqs", "deleteFailed");
  }
}
