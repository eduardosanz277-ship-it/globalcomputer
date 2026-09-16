import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import type { UserRole } from "@/modules/auth/auth.types";
import { recognizedAppLocale } from "@/lib/i18n/parse-locale";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { AdminUserDetail } from "./users.types";
import { sendBusinessApprovalEmail } from "@/lib/email/sendBusinessApprovalEmail";
import { sendBusinessRejectionEmail } from "@/lib/email/sendBusinessRejectionEmail";
import {
  ensureAdminAccess,
  resolveAdminLocale,
  userAdminError,
  userAdminErrorWithDetail,
} from "@/modules/admin/admin-errors";
import {
  repoApproveBusinessRegistration,
  repoRejectBusinessRegistration,
  repoGetAllUsers,
  repoUpdateUserRole,
  repoDeleteAuthUser,
} from "./users.repository";

export async function getAllUsersService(localeInput?: unknown) {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  return repoGetAllUsers();
}

export async function updateUserRoleService(
  userId: string,
  role: UserRole,
  localeInput?: unknown,
) {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  try {
    await repoUpdateUserRole(userId, role);
  } catch {
    throw userAdminError(locale, "updateRoleFailed");
  }
}

export async function approveBusinessRegistrationService(
  userId: string,
  localeInput?: unknown,
) {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, full_name, business_registration_status")
    .eq("id", userId)
    .maybeSingle();

  if (!profile || profile.role !== "BUSINESS") {
    throw userAdminError(locale, "approveBusinessOnly");
  }
  if (profile.business_registration_status === "approved") {
    return { alreadyApproved: true as const };
  }

  try {
    await repoApproveBusinessRegistration(userId);
  } catch {
    throw userAdminError(locale, "approveFailed");
  }

  const { data: authData } = await admin.auth.admin.getUserById(userId);
  const email = authData?.user?.email;
  if (email) {
    try {
      const recipientLocale = recognizedAppLocale(
        authData.user?.user_metadata?.locale,
      );
      const { sent } = await sendBusinessApprovalEmail(
        email,
        profile.full_name ?? "",
        recipientLocale,
      );
      if (!sent) {
        throw userAdminError(locale, "missingResendKey");
      }
    } catch (e) {
      const detail =
        e instanceof Error
          ? e.message
          : userAdminError(locale, "emailServiceFailed").message;
      throw userAdminErrorWithDetail(locale, "approveEmailFailed", detail);
    }
  }

  return { success: true as const };
}

/** Marca la solicitud como rechazada (pendiente, sin estado o aprobada). */
export async function rejectBusinessRegistrationService(
  userId: string,
  localeInput?: unknown,
) {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, full_name, business_registration_status")
    .eq("id", userId)
    .maybeSingle();

  if (!profile || profile.role !== "BUSINESS") {
    throw userAdminError(locale, "rejectBusinessOnly");
  }
  if (profile.business_registration_status === "rejected") {
    throw userAdminError(locale, "alreadyRejected");
  }

  try {
    await repoRejectBusinessRegistration(userId);
  } catch {
    throw userAdminError(locale, "rejectFailed");
  }

  const { data: authData } = await admin.auth.admin.getUserById(userId);
  const email = authData?.user?.email;
  if (email) {
    try {
      const recipientLocale = recognizedAppLocale(
        authData.user?.user_metadata?.locale,
      );
      const { sent } = await sendBusinessRejectionEmail(email, recipientLocale);
      if (!sent) {
        throw userAdminError(locale, "missingResendKey");
      }
    } catch (e) {
      const detail =
        e instanceof Error
          ? e.message
          : userAdminError(locale, "emailServiceFailed").message;
      throw userAdminErrorWithDetail(locale, "rejectEmailFailed", detail);
    }
  }

  return { success: true as const };
}

export async function deleteUserService(userId: string, localeInput?: unknown) {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);
  if (!current) {
    throw userAdminError(locale, "notAuthenticated");
  }
  if (current.id === userId) {
    throw userAdminError(locale, "cannotDeleteSelf");
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role === "ADMIN") {
    throw userAdminError(locale, "cannotDeleteAdmin");
  }

  try {
    await repoDeleteAuthUser(userId);
  } catch {
    throw userAdminError(locale, "deleteFailed");
  }
}

export async function getUserDetailService(
  userId: string,
  localeInput?: unknown,
): Promise<AdminUserDetail> {
  const locale = await resolveAdminLocale(localeInput);
  const current = await getCurrentUserStrictService();
  ensureAdminAccess(current?.role, locale);

  const admin = createSupabaseAdminClient();
  const { data: authData, error: authErr } =
    await admin.auth.admin.getUserById(userId);

  if (authErr || !authData?.user) {
    throw userAdminError(locale, "notFound");
  }

  const user = authData.user;

  const { data: profile } = await admin
    .from("profiles")
    .select(
      "full_name, role, created_at, phone, business_registration_status, employer_identification_number"
    )
    .eq("id", userId)
    .maybeSingle();

  const fromMeta =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null;

  const roleFromProfile = profile?.role as UserRole | undefined;
  const roleFromMeta =
    typeof user.user_metadata?.role === "string"
      ? (user.user_metadata.role as UserRole)
      : undefined;

  const role = roleFromProfile ?? roleFromMeta ?? "CLIENT";
  const brs = profile?.business_registration_status;
  const businessRegistrationStatus =
    brs === "pending" || brs === "approved" || brs === "rejected" ? brs : null;

  return {
    id: user.id,
    email: user.email ?? null,
    phone: profile?.phone ?? user.phone ?? null,
    fullName: profile?.full_name ?? fromMeta,
    role,
    businessRegistrationStatus,
    employerIdentificationNumber:
      profile?.employer_identification_number ?? null,
    createdAt: profile?.created_at ?? user.created_at ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
    emailConfirmedAt: user.email_confirmed_at ?? null,
  };
}
