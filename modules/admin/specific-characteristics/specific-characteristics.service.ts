import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import {
  adminInvalidDataError,
  ensureAdminAccess,
  mapAdminEntityDbError,
  resolveAdminLocale,
} from "@/modules/admin/admin-errors";
import {
  repoCreateSpecificCharacteristic,
  repoDeleteSpecificCharacteristic,
  repoListSpecificCharacteristics,
  repoUpdateSpecificCharacteristic,
} from "./specific-characteristics.repository";
import type {
  SpecificCharacteristicInsert,
  SpecificCharacteristicUpdate,
} from "./specific-characteristics.types";
import { specificCharacteristicFormSchema } from "./specific-characteristics.schema";
import { slugify } from "@/lib/slugify";

export async function getAllSpecificCharacteristicsService() {
  const locale = await resolveAdminLocale();
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  return repoListSpecificCharacteristics();
}

export async function createSpecificCharacteristicService(
  payload: SpecificCharacteristicInsert,
  localeInput?: unknown,
) {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  const parsed = specificCharacteristicFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw adminInvalidDataError(locale, parsed.error.errors[0]?.message);
  }
  try {
    const slug = slugify(parsed.data.name);
    return await repoCreateSpecificCharacteristic({ ...parsed.data, slug });
  } catch (e) {
    throw mapAdminEntityDbError(
      e,
      locale,
      "specificCharacteristics",
      "createFailed",
    );
  }
}

export async function updateSpecificCharacteristicService(
  id: string,
  payload: SpecificCharacteristicUpdate,
  localeInput?: unknown,
) {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  const parsed = specificCharacteristicFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw adminInvalidDataError(locale, parsed.error.errors[0]?.message);
  }
  try {
    const slug = slugify(parsed.data.name);
    await repoUpdateSpecificCharacteristic(id, { ...parsed.data, slug });
  } catch (e) {
    throw mapAdminEntityDbError(
      e,
      locale,
      "specificCharacteristics",
      "updateFailed",
    );
  }
}

export async function deleteSpecificCharacteristicService(
  id: string,
  localeInput?: unknown,
) {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  try {
    await repoDeleteSpecificCharacteristic(id);
  } catch (e) {
    throw mapAdminEntityDbError(
      e,
      locale,
      "specificCharacteristics",
      "deleteFailed",
    );
  }
}
