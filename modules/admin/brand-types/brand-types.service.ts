import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import {
  adminInvalidDataError,
  ensureAdminAccess,
  mapAdminEntityDbError,
  resolveAdminLocale,
} from "@/modules/admin/admin-errors";
import {
  repoCreateBrandType,
  repoDeleteBrandType,
  repoListBrandTypes,
  repoUpdateBrandType,
} from "./brand-types.repository";
import type { BrandTypeInsert, BrandTypeUpdate } from "./brand-types.types";
import { brandTypeFormSchema } from "./brand-types.schema";
import { slugify } from "@/lib/slugify";

export async function getAllBrandTypesService() {
  const locale = await resolveAdminLocale();
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  return repoListBrandTypes();
}

export async function createBrandTypeService(
  payload: BrandTypeInsert,
  localeInput?: unknown,
) {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  const parsed = brandTypeFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw adminInvalidDataError(locale, parsed.error.errors[0]?.message);
  }
  const slug = slugify(parsed.data.name);
  try {
    return await repoCreateBrandType({ ...parsed.data, slug });
  } catch (e) {
    throw mapAdminEntityDbError(e, locale, "brandTypes", "createFailed");
  }
}

export async function updateBrandTypeService(
  id: string,
  payload: BrandTypeUpdate,
  localeInput?: unknown,
) {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  const partial = brandTypeFormSchema.pick({
    brandId: true,
    name: true,
    nameEn: true,
    active: true,
  });
  const parsed = partial.safeParse(payload);
  if (!parsed.success) {
    throw adminInvalidDataError(locale, parsed.error.errors[0]?.message);
  }
  const slug = slugify(parsed.data.name);
  try {
    await repoUpdateBrandType(id, { ...parsed.data, slug });
  } catch (e) {
    throw mapAdminEntityDbError(e, locale, "brandTypes", "updateFailed");
  }
}

export async function deleteBrandTypeService(id: string, localeInput?: unknown) {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  try {
    await repoDeleteBrandType(id);
  } catch (e) {
    throw mapAdminEntityDbError(e, locale, "brandTypes", "deleteFailed");
  }
}
