"use server";

import type { UserRole } from "@/modules/auth/auth.types";
import {
  approveBusinessRegistrationService,
  rejectBusinessRegistrationService,
  updateUserRoleService,
  deleteUserService,
  getUserDetailService,
} from "@/modules/admin/users/users.service";
import {
  runServerAction,
  type ServerActionResult,
} from "@/lib/errors/run-server-action";
import { resolveAdminLocale } from "@/modules/admin/admin-errors";
import type { AdminUserDetail } from "@/modules/admin/users/users.types";

export async function approveBusinessRegistrationAction(
  userId: string,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.users.approveFailed",
    () => approveBusinessRegistrationService(userId, resolvedLocale),
  );
}

export async function rejectBusinessRegistrationAction(
  userId: string,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.users.rejectFailed",
    () => rejectBusinessRegistrationService(userId, resolvedLocale),
  );
}

export async function updateUserRoleAction(
  userId: string,
  role: UserRole,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.users.updateRoleFailed",
    () => updateUserRoleService(userId, role, resolvedLocale),
  );
}

export async function deleteUserAction(
  userId: string,
  locale?: string,
): Promise<ServerActionResult> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.users.deleteFailed",
    () => deleteUserService(userId, resolvedLocale),
  );
}

export async function getUserDetailAction(
  userId: string,
  locale?: string,
): Promise<ServerActionResult<AdminUserDetail>> {
  const resolvedLocale = await resolveAdminLocale(locale);
  return runServerAction(
    resolvedLocale,
    "admin.errors.users.notFound",
    () => getUserDetailService(userId, resolvedLocale),
  );
}
