import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import type { UserRole } from "@/modules/auth/auth.types";
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

function ensureAdmin(role?: UserRole) {
  if (role !== "ADMIN") {
    throw new Error("Acceso restringido a administradores");
  }
}

function mapDbError(err: unknown, fallback: string): Error {
  const msg = err instanceof Error ? err.message : String(err);
  if (/duplicate key|23505|unique constraint/i.test(msg)) {
    return new Error("Ya existe una característica general con ese nombre.");
  }
  if (/foreign key|23503|violates/i.test(msg)) {
    return new Error(
      "No se puede eliminar: existen productos u otros registros vinculados a esta característica."
    );
  }
  return err instanceof Error ? err : new Error(fallback);
}

export async function getAllGeneralCharacteristicsService() {
  const current = await getCurrentUserStrictService();
  ensureAdmin(current?.role);
  return repoListGeneralCharacteristics();
}

export async function createGeneralCharacteristicService(
  payload: GeneralCharacteristicInsert
) {
  const current = await getCurrentUserStrictService();
  ensureAdmin(current?.role);
  const parsed = generalCharacteristicFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }
  try {
    const slug = slugify(parsed.data.name);
    return await repoCreateGeneralCharacteristic({ ...parsed.data, slug });
  } catch (e) {
    throw mapDbError(e, "No se pudo crear la característica");
  }
}

export async function updateGeneralCharacteristicService(
  id: string,
  payload: GeneralCharacteristicUpdate
) {
  const current = await getCurrentUserStrictService();
  ensureAdmin(current?.role);
  const parsed = generalCharacteristicFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }
  try {
    const slug = slugify(parsed.data.name);
    await repoUpdateGeneralCharacteristic(id, { ...parsed.data, slug });
  } catch (e) {
    throw mapDbError(e, "No se pudo actualizar la característica");
  }
}

export async function deleteGeneralCharacteristicService(id: string) {
  const current = await getCurrentUserStrictService();
  ensureAdmin(current?.role);
  try {
    await repoDeleteGeneralCharacteristic(id);
  } catch (e) {
    throw mapDbError(e, "No se pudo eliminar la característica");
  }
}
