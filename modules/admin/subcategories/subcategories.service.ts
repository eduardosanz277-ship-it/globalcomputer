import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import {
  adminInvalidDataError,
  ensureAdminAccess,
  mapAdminEntityDbError,
  resolveAdminLocale,
} from "@/modules/admin/admin-errors";
import { subcategoryFormSchema } from "./subcategories.schema";
import {
  repoCreateSubcategoryAdmin,
  repoListAllSubcategoriesAdmin,
  repoSoftDeleteSubcategoryAdmin,
  repoUpdateSubcategoryAdmin,
} from "./subcategories.repository";
import type {
  SubcategoryAdminInsert,
  SubcategoryAdminUpdate,
} from "./subcategories.types";
import { slugify } from "@/lib/slugify";

export async function getAllSubcategoriesAdminService() {
  const locale = await resolveAdminLocale();
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  return repoListAllSubcategoriesAdmin();
}

export async function createSubcategoryAdminService(
  payload: SubcategoryAdminInsert,
  localeInput?: unknown,
) {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  const parsed = subcategoryFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw adminInvalidDataError(locale, parsed.error.errors[0]?.message);
  }
  const slug = slugify(parsed.data.name);
  try {
    return await repoCreateSubcategoryAdmin({ ...parsed.data, slug });
  } catch (e) {
    throw mapAdminEntityDbError(e, locale, "subcategories", "createFailed");
  }
}

export async function updateSubcategoryAdminService(
  id: string,
  payload: SubcategoryAdminUpdate,
  localeInput?: unknown,
) {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  const parsed = subcategoryFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw adminInvalidDataError(locale, parsed.error.errors[0]?.message);
  }
  const slug = slugify(parsed.data.name);
  try {
    await repoUpdateSubcategoryAdmin(id, { ...parsed.data, slug });
  } catch (e) {
    throw mapAdminEntityDbError(e, locale, "subcategories", "updateFailed");
  }
}

export async function softDeleteSubcategoryAdminService(
  id: string,
  localeInput?: unknown,
) {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  try {
    await repoSoftDeleteSubcategoryAdmin(id);
  } catch (e) {
    throw mapAdminEntityDbError(e, locale, "subcategories", "archiveFailed");
  }
}
