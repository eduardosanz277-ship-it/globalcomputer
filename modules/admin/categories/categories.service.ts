import { getCurrentUserService } from "@/modules/auth/auth.service";
import type { UserRole } from "@/modules/auth/auth.types";
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

function ensureAdmin(role?: UserRole) {
  if (role !== "ADMIN") {
    throw new Error("Acceso restringido a administradores");
  }
}

function mapDbError(err: unknown, fallback: string): Error {
  const msg = err instanceof Error ? err.message : String(err);
  if (/duplicate key|23505|unique constraint/i.test(msg)) {
    return new Error("Ya existe una categoría activa con ese nombre.");
  }
  if (/foreign key|23503|violates/i.test(msg)) {
    return new Error(
      "No se puede completar la operación: hay productos u otras filas vinculadas a esta categoría.",
    );
  }
  return err instanceof Error ? err : new Error(fallback);
}

export async function getCatalogCategoriesForAdminService(): Promise<
  [AdminCategory[], AdminSubcategory[]]
> {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  return Promise.all([
    repoListCategoriesForAdmin(),
    repoListSubcategoriesForProductForm(),
  ]);
}

export async function getAllCategoriesAdminService() {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  return repoListAllCategoriesAdmin();
}

export async function createCategoryAdminService(payload: CategoryAdminInsert) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  const parsed = categoryFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }
  const slug = slugify(parsed.data.name);
  try {
    return await repoCreateCategoryAdmin({ ...parsed.data, slug });
  } catch (e) {
    throw mapDbError(e, "No se pudo crear la categoría");
  }
}

export async function updateCategoryAdminService(
  id: string,
  payload: CategoryAdminUpdate,
) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  const parsed = categoryFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }
  const slug = slugify(parsed.data.name);
  try {
    await repoUpdateCategoryAdmin(id, { ...parsed.data, slug });
  } catch (e) {
    throw mapDbError(e, "No se pudo actualizar la categoría");
  }
}

export async function softDeleteCategoryAdminService(id: string) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  try {
    await repoSoftDeleteCategoryAdmin(id);
  } catch (e) {
    throw mapDbError(e, "No se pudo archivar la categoría");
  }
}
