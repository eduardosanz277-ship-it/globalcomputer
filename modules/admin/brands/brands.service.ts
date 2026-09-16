import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import {
  adminInvalidDataError,
  ensureAdminAccess,
  mapAdminEntityDbError,
  resolveAdminLocale,
} from "@/modules/admin/admin-errors";
import {
  repoCreateBrand,
  repoDeleteBrand,
  repoListBrands,
  repoUpdateBrand,
} from "./brands.repository";
import type { BrandInsert, BrandUpdate } from "./brands.types";
import { brandFormSchema } from "./brands.schema";
import { slugify } from "@/lib/slugify";

export async function getAllBrandsService() {
  const locale = await resolveAdminLocale();
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  return repoListBrands();
}

export async function createBrandService(
  payload: BrandInsert,
  localeInput?: unknown,
) {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  const parsed = brandFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw adminInvalidDataError(locale, parsed.error.errors[0]?.message);
  }
  const slug = slugify(parsed.data.name);
  try {
    return await repoCreateBrand({ ...parsed.data, slug });
  } catch (e) {
    throw mapAdminEntityDbError(e, locale, "brands", "createFailed");
  }
}

export async function updateBrandService(
  id: string,
  payload: BrandUpdate,
  localeInput?: unknown,
) {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  const parsed = brandFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw adminInvalidDataError(locale, parsed.error.errors[0]?.message);
  }
  const slug = slugify(parsed.data.name);
  try {
    await repoUpdateBrand(id, { ...parsed.data, slug });
  } catch (e) {
    throw mapAdminEntityDbError(e, locale, "brands", "updateFailed");
  }
}

export async function deleteBrandService(id: string, localeInput?: unknown) {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  try {
    await repoDeleteBrand(id);
  } catch (e) {
    throw mapAdminEntityDbError(e, locale, "brands", "deleteFailed");
  }
}
