"use server";

import type { UserRole } from "@/modules/auth/auth.types";
import { updateUserRoleService } from "@/modules/admin/users/users.service";

export async function updateUserRoleAction(userId: string, role: UserRole) {
  await updateUserRoleService(userId, role);
}

