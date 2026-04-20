import { getCurrentUserService } from "@/modules/auth/auth.service";
import type { UserRole } from "@/modules/auth/auth.types";
import { faqFormSchema } from "./faqs.schema";
import {
  repoCreateFaqAdmin,
  repoDeleteFaqAdmin,
  repoListAllFaqsAdmin,
  repoUpdateFaqAdmin,
} from "./faqs.repository";
import type { FaqAdminInsert, FaqAdminUpdate } from "./faqs.types";

function ensureAdmin(role?: UserRole) {
  if (role !== "ADMIN") {
    throw new Error("Acceso restringido a administradores");
  }
}

function mapDbError(err: unknown, fallback: string): Error {
  const msg = err instanceof Error ? err.message : String(err);
  if (/23505|unique constraint|duplicate key/i.test(msg)) {
    return new Error("Ya existe una FAQ con el mismo contenido.");
  }
  return err instanceof Error ? err : new Error(fallback);
}

export async function getAllFaqsAdminService() {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  return repoListAllFaqsAdmin();
}

export async function createFaqAdminService(payload: FaqAdminInsert) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  const parsed = faqFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }
  try {
    return await repoCreateFaqAdmin(parsed.data);
  } catch (e) {
    throw mapDbError(e, "No se pudo crear la pregunta frecuente");
  }
}

export async function updateFaqAdminService(id: string, payload: FaqAdminUpdate) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  const parsed = faqFormSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Datos inválidos");
  }
  try {
    await repoUpdateFaqAdmin(id, parsed.data);
  } catch (e) {
    throw mapDbError(e, "No se pudo actualizar la pregunta frecuente");
  }
}

export async function deleteFaqAdminService(id: string) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  try {
    await repoDeleteFaqAdmin(id);
  } catch (e) {
    throw mapDbError(e, "No se pudo eliminar la pregunta frecuente");
  }
}
