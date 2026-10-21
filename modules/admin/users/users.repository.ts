import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { AdminUser } from "./users.types";
import type { UserRole } from "@/modules/auth/auth.types";
import type { AdminTablePage, AdminTableQuery } from "@/lib/admin/server-table";

export type AdminUsersPageQuery = AdminTableQuery & {
  role: "CLIENT" | "BUSINESS" | null;
};

type AdminUsersPageRow = {
  id: string;
  full_name: string | null;
  role: string | null;
  created_at: string | null;
  business_registration_status: string | null;
  email: string | null;
  last_sign_in_at: string | null;
};

/**
 * Página del listado de usuarios: clientes completos y empresas con registro aprobado.
 * Búsqueda, filtro de rol, orden y paginación en SQL (`admin_users_page`), que también
 * aporta email y último acceso desde `auth.users` sin recorrer toda la Admin API.
 */
export async function repoListUsersPage(
  query: AdminUsersPageQuery,
): Promise<AdminTablePage<AdminUser>> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("admin_users_page", {
    p_search: query.q || null,
    p_role: query.role,
    p_sort: query.sort?.id ?? null,
    p_desc: query.sort?.desc ?? false,
    p_page: query.pageIndex,
    p_page_size: query.pageSize,
  });

  if (error) {
    throw error;
  }

  const result = (data ?? {}) as {
    rows?: AdminUsersPageRow[];
    row_count?: number;
    page?: number;
  };

  return {
    rows: (result.rows ?? []).map((row) => {
      const brs = row.business_registration_status;
      const businessRegistrationStatus =
        brs === "pending" || brs === "approved" || brs === "rejected"
          ? brs
          : null;
      return {
        id: row.id,
        email: row.email ?? null,
        fullName: row.full_name ?? null,
        role: (row.role as UserRole) ?? "CLIENT",
        businessRegistrationStatus,
        createdAt: row.created_at,
        lastSignInAt: row.last_sign_in_at ?? null,
      };
    }),
    rowCount: Number(result.row_count ?? 0),
    pageIndex: Number(result.page ?? 0),
  };
}

export async function repoUpdateUserRole(userId: string, role: UserRole) {
  const admin = createSupabaseAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) throw error;
}

export async function repoApproveBusinessRegistration(userId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update({
      business_registration_status: "approved",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .eq("role", "BUSINESS")
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(
      "No se pudo marcar la solicitud como aprobada (no se actualizó ningún perfil empresa). Revisa que el usuario exista y tenga rol empresa."
    );
  }
}

export async function repoRejectBusinessRegistration(userId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update({
      business_registration_status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .eq("role", "BUSINESS")
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(
      "No se pudo rechazar la solicitud (no se actualizó ningún perfil empresa)."
    );
  }
}

/** Elimina el usuario en Auth (y normalmente el perfil en cascada). Requiere service role. */
export async function repoDeleteAuthUser(userId: string) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw error;
}

