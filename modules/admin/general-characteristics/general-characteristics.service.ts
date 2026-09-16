import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import {
  adminInvalidDataError,
  ensureAdminAccess,
  mapAdminEntityDbError,
  resolveAdminLocale,
} from "@/modules/admin/admin-errors";
import {
  repoCreateGeneralCharacteristic,
  repoDeleteGeneralCharacteristic,
  repoListGeneralCharacteristics,
  repoUpdateGeneralCharacteristic,
} from "./general-characteristics.repository";
import type {
  GeneralCharacteristicInsert,
  GeneralCharacteristicUpdate,
} from "./general-characteristics.types";
import { generalCharacteristicFormSchema } from "./general-characteristics.schema";
import { slugify } from "@/lib/slugify";

export async function getAllGeneralCharacteristicsService() {
  const locale = await resolveAdminLocale();
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  return repoListGeneralCharacteristics();
}

export async function createGeneralCharacteristicService(
  payload: GeneralCharacteristicInsert,
  localeInput?: unknown,
) {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  const parsed = generalCharacteristicFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw adminInvalidDataError(locale, parsed.error.errors[0]?.message);
  }
  try {
    const slug = slugify(parsed.data.name);
    return await repoCreateGeneralCharacteristic({ ...parsed.data, slug });
  } catch (e) {
    throw mapAdminEntityDbError(
      e,
      locale,
      "generalCharacteristics",
      "createFailed",
    );
  }
}

export async function updateGeneralCharacteristicService(
  id: string,
  payload: GeneralCharacteristicUpdate,
  localeInput?: unknown,
) {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  const parsed = generalCharacteristicFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw adminInvalidDataError(locale, parsed.error.errors[0]?.message);
  }
  try {
    const slug = slugify(parsed.data.name);
    await repoUpdateGeneralCharacteristic(id, { ...parsed.data, slug });
  } catch (e) {
    throw mapAdminEntityDbError(
      e,
      locale,
      "generalCharacteristics",
      "updateFailed",
    );
  }
}

export async function deleteGeneralCharacteristicService(
  id: string,
  localeInput?: unknown,
) {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  try {
    await repoDeleteGeneralCharacteristic(id);
  } catch (e) {
    throw mapAdminEntityDbError(
      e,
      locale,
      "generalCharacteristics",
      "deleteFailed",
    );
  }
}
