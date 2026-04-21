import { getCurrentUserService } from "@/modules/auth/auth.service";
import type { UserRole } from "@/modules/auth/auth.types";
import {
  repoCreateBrand,
  repoDeleteBrand,
  repoListBrands,
  repoUpdateBrand,
} from "./brands.repository";
import type { BrandInsert, BrandUpdate } from "./brands.types";
import { brandFormSchema } from "./brands.schema";
import { slugify } from "@/lib/slugify";

function ensureAdmin(role?: UserRole) {
  if (role !== "ADMIN") {
    throw new Error("Acceso restringido a administradores");
  }
}

function mapDbError(err: unknown, fallback: string): Error {
  const msg = err instanceof Error ? err.message : String(err);
  if (/duplicate key|23505|unique constraint/i.test(msg)) {
    return new Error("Ya existe una marca con ese nombre.");
  }
  if (/foreign key|23503|violates/i.test(msg)) {
    return new Error(
      "No se puede eliminar: existen productos u otros registros vinculados a esta marca."
    );
  }
  return err instanceof Error ? err : new Error(fallback);
}

export async function getAllBrandsService() {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  return repoListBrands();
}

export async function createBrandService(payload: BrandInsert) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  const parsed = brandFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }
  const slug = slugify(parsed.data.name);
  try {
    return await repoCreateBrand({ ...parsed.data, slug });
  } catch (e) {
    throw mapDbError(e, "No se pudo crear la marca");
  }
}

export async function updateBrandService(id: string, payload: BrandUpdate) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  const parsed = brandFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }
  const slug = slugify(parsed.data.name);
  try {
    await repoUpdateBrand(id, { ...parsed.data, slug });
  } catch (e) {
    throw mapDbError(e, "No se pudo actualizar la marca");
  }
}

export async function deleteBrandService(id: string) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  try {
    await repoDeleteBrand(id);
  } catch (e) {
    throw mapDbError(e, "No se pudo eliminar la marca");
  }
}
