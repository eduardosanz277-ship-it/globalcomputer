import { getCurrentUserService } from "@/modules/auth/auth.service";
import type { UserRole } from "@/modules/auth/auth.types";
import { repoGetAllUsers, repoUpdateUserRole } from "./users.repository";

function ensureAdmin(role?: UserRole) {
  if (role !== "ADMIN") {
    throw new Error("Acceso restringido a administradores");
  }
}

export async function getAllUsersService() {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  return repoGetAllUsers();
}

export async function updateUserRoleService(userId: string, role: UserRole) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  await repoUpdateUserRole(userId, role);
}

