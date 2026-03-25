import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { AdminUser } from "./users.types";
import type { UserRole } from "@/modules/auth/auth.types";

export async function repoGetAllUsers(): Promise<AdminUser[]> {
  const admin = createSupabaseAdminClient();

  /** Clientes completos; comercios solo con registro aprobado (no admin ni empresas pendientes). */
  const { data, error } = await admin
    .from("profiles")
    .select("id, full_name, role, created_at, business_registration_status")
    .or(
      "role.eq.CLIENT,and(role.eq.BUSINESS,business_registration_status.eq.approved)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const lastSignInById = new Map<string, string | null>();
  const emailById = new Map<string, string | null>();
  let page = 1;
  const perPage = 1000;
  const maxPages = 50;

  while (page <= maxPages) {
    const { data: listData, error: listErr } =
      await admin.auth.admin.listUsers({ page, perPage });
    if (listErr) throw listErr;

    const users = listData?.users ?? [];
    for (const u of users) {
      lastSignInById.set(u.id, u.last_sign_in_at ?? null);
      emailById.set(u.id, u.email ?? null);
    }
    if (users.length < perPage) break;
    page += 1;
  }

  return (data ?? []).map((row: any) => {
    const brs = row.business_registration_status;
    const businessRegistrationStatus =
      brs === "pending" || brs === "approved" || brs === "rejected"
        ? brs
        : null;
    return {
      id: row.id as string,
      email: emailById.get(row.id as string) ?? null,
      fullName: row.full_name ?? null,
      role: (row.role as UserRole) ?? "CLIENT",
      businessRegistrationStatus,
      createdAt: row.created_at,
      lastSignInAt: lastSignInById.get(row.id as string) ?? null,
    };
  });
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

