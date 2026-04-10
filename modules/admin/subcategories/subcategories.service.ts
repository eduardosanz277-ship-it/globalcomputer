import { getCurrentUserService } from "@/modules/auth/auth.service";
import type { UserRole } from "@/modules/auth/auth.types";
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

function ensureAdmin(role?: UserRole) {
  if (role !== "ADMIN") {
    throw new Error("Acceso restringido a administradores");
  }
}

function mapDbError(err: unknown, fallback: string): Error {
  const msg = err instanceof Error ? err.message : String(err);
  if (/duplicate key|23505|unique constraint/i.test(msg)) {
    return new Error(
      "Ya existe una subcategoría activa con ese nombre en la categoría seleccionada.",
    );
  }
  if (/foreign key|23503|violates/i.test(msg)) {
    return new Error(
      "No se puede completar la operación: hay productos u otras filas vinculadas a esta subcategoría.",
    );
  }
  return err instanceof Error ? err : new Error(fallback);
}

export async function getAllSubcategoriesAdminService() {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  return repoListAllSubcategoriesAdmin();
}

export async function createSubcategoryAdminService(
  payload: SubcategoryAdminInsert,
) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  const parsed = subcategoryFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }
  try {
    return await repoCreateSubcategoryAdmin(parsed.data);
  } catch (e) {
    throw mapDbError(e, "No se pudo crear la subcategoría");
  }
}

export async function updateSubcategoryAdminService(
  id: string,
  payload: SubcategoryAdminUpdate,
) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  const parsed = subcategoryFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }
  try {
    await repoUpdateSubcategoryAdmin(id, parsed.data);
  } catch (e) {
    throw mapDbError(e, "No se pudo actualizar la subcategoría");
  }
}

export async function softDeleteSubcategoryAdminService(id: string) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  try {
    await repoSoftDeleteSubcategoryAdmin(id);
  } catch (e) {
    throw mapDbError(e, "No se pudo archivar la subcategoría");
  }
}
