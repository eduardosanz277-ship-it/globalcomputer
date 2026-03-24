import { getCurrentUserService } from "@/modules/auth/auth.service";
import type { UserRole } from "@/modules/auth/auth.types";
import { repoListBusinessProfiles } from "./business-profiles.repository";

function ensureAdmin(role?: UserRole) {
  if (role !== "ADMIN") {
    throw new Error("Acceso restringido a administradores");
  }
}

/** Datos desde `profiles` donde `role` es empresa (BUSINESS). */
export async function listBusinessProfilesService() {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  return repoListBusinessProfiles();
}
