import { getCurrentUserService } from "@/modules/auth/auth.service";
import type { UserRole } from "@/modules/auth/auth.types";
import {
  repoCreateBrandType,
  repoDeleteBrandType,
  repoListBrandTypes,
  repoUpdateBrandType,
} from "./brand-types.repository";
import type { BrandTypeInsert, BrandTypeUpdate } from "./brand-types.types";
import { brandTypeFormSchema } from "./brand-types.schema";
import { slugify } from "@/lib/slugify";

function ensureAdmin(role?: UserRole) {
  if (role !== "ADMIN") {
    throw new Error("Acceso restringido a administradores");
  }
}

function mapDbError(err: unknown, fallback: string): Error {
  const msg = err instanceof Error ? err.message : String(err);
  if (/duplicate key|23505|unique constraint/i.test(msg)) {
    return new Error(
      "Ya existe un tipo con ese nombre para la marca seleccionada."
    );
  }
  if (/foreign key|23503|violates/i.test(msg)) {
    return new Error(
      "No se puede eliminar: existen productos u otros registros vinculados a este tipo."
    );
  }
  return err instanceof Error ? err : new Error(fallback);
}

export async function getAllBrandTypesService() {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  return repoListBrandTypes();
}

export async function createBrandTypeService(payload: BrandTypeInsert) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  const parsed = brandTypeFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }
  const slug = slugify(parsed.data.name);
  try {
    return await repoCreateBrandType({ ...parsed.data, slug });
  } catch (e) {
    throw mapDbError(e, "No se pudo crear el tipo");
  }
}

export async function updateBrandTypeService(
  id: string,
  payload: BrandTypeUpdate
) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  const partial = brandTypeFormSchema.pick({
    brandId: true,
    name: true,
    active: true,
  });
  const parsed = partial.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }
  const slug = slugify(parsed.data.name);
  try {
    await repoUpdateBrandType(id, { ...parsed.data, slug });
  } catch (e) {
    throw mapDbError(e, "No se pudo actualizar el tipo");
  }
}

export async function deleteBrandTypeService(id: string) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  try {
    await repoDeleteBrandType(id);
  } catch (e) {
    throw mapDbError(e, "No se pudo eliminar el tipo");
  }
}
