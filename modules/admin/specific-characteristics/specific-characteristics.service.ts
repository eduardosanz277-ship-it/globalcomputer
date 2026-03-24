import { getCurrentUserService } from "@/modules/auth/auth.service";
import type { UserRole } from "@/modules/auth/auth.types";
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

function ensureAdmin(role?: UserRole) {
  if (role !== "ADMIN") {
    throw new Error("Acceso restringido a administradores");
  }
}

function mapDbError(err: unknown, fallback: string): Error {
  const msg = err instanceof Error ? err.message : String(err);
  if (/duplicate key|23505|unique constraint/i.test(msg)) {
    return new Error(
      "Ya existe una característica específica con ese nombre para la característica general seleccionada."
    );
  }
  if (/foreign key|23503|violates/i.test(msg)) {
    return new Error(
      "No se puede eliminar: existen productos u otros registros vinculados a esta característica específica."
    );
  }
  return err instanceof Error ? err : new Error(fallback);
}

export async function getAllSpecificCharacteristicsService() {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  return repoListSpecificCharacteristics();
}

export async function createSpecificCharacteristicService(
  payload: SpecificCharacteristicInsert
) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  const parsed = specificCharacteristicFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }
  try {
    return await repoCreateSpecificCharacteristic(parsed.data);
  } catch (e) {
    throw mapDbError(e, "No se pudo crear la característica específica");
  }
}

export async function updateSpecificCharacteristicService(
  id: string,
  payload: SpecificCharacteristicUpdate
) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  const parsed = specificCharacteristicFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }
  try {
    await repoUpdateSpecificCharacteristic(id, parsed.data);
  } catch (e) {
    throw mapDbError(e, "No se pudo actualizar la característica específica");
  }
}

export async function deleteSpecificCharacteristicService(id: string) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  try {
    await repoDeleteSpecificCharacteristic(id);
  } catch (e) {
    throw mapDbError(e, "No se pudo eliminar la característica específica");
  }
}
