import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import type { UserRole } from "@/modules/auth/auth.types";
import { recognizedAppLocale } from "@/lib/i18n/parse-locale";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { AdminUserDetail } from "./users.types";
import { sendBusinessApprovalEmail } from "@/lib/email/sendBusinessApprovalEmail";
import {
  repoApproveBusinessRegistration,
  repoRejectBusinessRegistration,
  repoGetAllUsers,
  repoUpdateUserRole,
  repoDeleteAuthUser,
} from "./users.repository";

function ensureAdmin(role?: UserRole) {
  if (role !== "ADMIN") {
    throw new Error("Acceso restringido a administradores");
  }
}

export async function getAllUsersService() {
  const current = await getCurrentUserStrictService();
  ensureAdmin(current?.role);
  return repoGetAllUsers();
}

export async function updateUserRoleService(userId: string, role: UserRole) {
  const current = await getCurrentUserStrictService();
  ensureAdmin(current?.role);
  await repoUpdateUserRole(userId, role);
}

export async function approveBusinessRegistrationService(userId: string) {
  const current = await getCurrentUserStrictService();
  ensureAdmin(current?.role);

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, full_name, business_registration_status")
    .eq("id", userId)
    .maybeSingle();

  if (!profile || profile.role !== "BUSINESS") {
    throw new Error("Solo se pueden aprobar cuentas de tipo empresa.");
  }
  if (profile.business_registration_status === "approved") {
    return { alreadyApproved: true as const };
  }

  await repoApproveBusinessRegistration(userId);

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
        throw new Error(
          "Falta RESEND_API_KEY; no se envió el correo de aviso."
        );
      }
    } catch (e) {
      const detail =
        e instanceof Error
          ? e.message
          : "Error al contactar con el servicio de correo.";
      throw new Error(
        `La cuenta quedó aprobada en el sistema, pero el correo no se pudo enviar: ${detail}`
      );
    }
  }

  return { success: true as const };
}

/** Marca la solicitud como rechazada (pendiente, sin estado o aprobada). */
export async function rejectBusinessRegistrationService(userId: string) {
  const current = await getCurrentUserStrictService();
  ensureAdmin(current?.role);

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, business_registration_status")
    .eq("id", userId)
    .maybeSingle();

  if (!profile || profile.role !== "BUSINESS") {
    throw new Error("Solo se pueden rechazar solicitudes de tipo empresa.");
  }
  if (profile.business_registration_status === "rejected") {
    throw new Error("Esta solicitud ya está rechazada.");
  }

  await repoRejectBusinessRegistration(userId);
  return { success: true as const };
}

export async function deleteUserService(userId: string) {
  const current = await getCurrentUserStrictService();
  ensureAdmin(current?.role);
  if (!current) {
    throw new Error("No autenticado");
  }
  if (current.id === userId) {
    throw new Error("No puedes eliminar tu propio usuario");
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role === "ADMIN") {
    throw new Error("No se puede eliminar un usuario administrador");
  }

  await repoDeleteAuthUser(userId);
}

export async function getUserDetailService(
  userId: string
): Promise<AdminUserDetail> {
  const current = await getCurrentUserStrictService();
  ensureAdmin(current?.role);

  const admin = createSupabaseAdminClient();
  const { data: authData, error: authErr } =
    await admin.auth.admin.getUserById(userId);

  if (authErr || !authData?.user) {
    throw new Error("Usuario no encontrado");
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

