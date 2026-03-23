import { getCurrentUserService } from "@/modules/auth/auth.service";
import type { UserRole } from "@/modules/auth/auth.types";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { AdminUserDetail } from "./users.types";
import {
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
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  return repoGetAllUsers();
}

export async function updateUserRoleService(userId: string, role: UserRole) {
  const current = await getCurrentUserService();
  ensureAdmin(current?.role);
  await repoUpdateUserRole(userId, role);
}

export async function deleteUserService(userId: string) {
  const current = await getCurrentUserService();
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
  const current = await getCurrentUserService();
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
    .select("full_name, role, created_at")
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

  return {
    id: user.id,
    email: user.email ?? null,
    phone: user.phone ?? null,
    fullName: profile?.full_name ?? fromMeta,
    role: roleFromProfile ?? roleFromMeta ?? "CLIENT",
    createdAt: profile?.created_at ?? user.created_at ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
    emailConfirmedAt: user.email_confirmed_at ?? null,
  };
}

