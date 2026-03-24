"use server";

import type { UserRole } from "@/modules/auth/auth.types";
import {
  approveBusinessRegistrationService,
  rejectBusinessRegistrationService,
  updateUserRoleService,
  deleteUserService,
  getUserDetailService,
} from "@/modules/admin/users/users.service";

export async function approveBusinessRegistrationAction(userId: string) {
  await approveBusinessRegistrationService(userId);
}

export async function rejectBusinessRegistrationAction(userId: string) {
  await rejectBusinessRegistrationService(userId);
}

export async function updateUserRoleAction(userId: string, role: UserRole) {
  await updateUserRoleService(userId, role);
}

export async function deleteUserAction(userId: string) {
  await deleteUserService(userId);
}

export async function getUserDetailAction(userId: string) {
  return getUserDetailService(userId);
}
