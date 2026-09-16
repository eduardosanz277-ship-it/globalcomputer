import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import {
  adminInvalidDataError,
  ensureAdminAccess,
  mapAdminEntityDbError,
  resolveAdminLocale,
} from "@/modules/admin/admin-errors";
import { categoryFormSchema } from "./categories.schema";
import {
  repoCreateCategoryAdmin,
  repoListAllCategoriesAdmin,
  repoListCategoriesForAdmin,
  repoSoftDeleteCategoryAdmin,
  repoUpdateCategoryAdmin,
} from "./categories.repository";
import { repoListSubcategoriesForProductForm } from "../subcategories/subcategories.repository";
import type {
  AdminCategory,
  AdminSubcategory,
  CategoryAdminInsert,
  CategoryAdminUpdate,
} from "./categories.types";
import { slugify } from "@/lib/slugify";

export async function getCatalogCategoriesForAdminService(): Promise<
  [AdminCategory[], AdminSubcategory[]]
> {
  const locale = await resolveAdminLocale();
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  return Promise.all([
    repoListCategoriesForAdmin(),
    repoListSubcategoriesForProductForm(),
  ]);
}

export async function getAllCategoriesAdminService() {
  const locale = await resolveAdminLocale();
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  return repoListAllCategoriesAdmin();
}

export async function createCategoryAdminService(
  payload: CategoryAdminInsert,
  localeInput?: unknown,
) {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  const parsed = categoryFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw adminInvalidDataError(locale, parsed.error.errors[0]?.message);
  }
  const slug = slugify(parsed.data.name);
  try {
    return await repoCreateCategoryAdmin({ ...parsed.data, slug });
  } catch (e) {
    throw mapAdminEntityDbError(e, locale, "categories", "createFailed");
  }
}

export async function updateCategoryAdminService(
  id: string,
  payload: CategoryAdminUpdate,
  localeInput?: unknown,
) {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  const parsed = categoryFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw adminInvalidDataError(locale, parsed.error.errors[0]?.message);
  }
  const slug = slugify(parsed.data.name);
  try {
    await repoUpdateCategoryAdmin(id, { ...parsed.data, slug });
  } catch (e) {
    throw mapAdminEntityDbError(e, locale, "categories", "updateFailed");
  }
}

export async function softDeleteCategoryAdminService(
  id: string,
  localeInput?: unknown,
) {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  try {
    await repoSoftDeleteCategoryAdmin(id);
  } catch (e) {
    throw mapAdminEntityDbError(e, locale, "categories", "archiveFailed");
  }
}
