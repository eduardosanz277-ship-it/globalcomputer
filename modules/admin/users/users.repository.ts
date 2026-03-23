import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { AdminUser } from "./users.types";
import type { UserRole } from "@/modules/auth/auth.types";

export async function repoGetAllUsers(): Promise<AdminUser[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const lastSignInById = new Map<string, string | null>();
  const admin = createSupabaseAdminClient();
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
    }
    if (users.length < perPage) break;
    page += 1;
  }

  return (data ?? []).map((row: any) => ({
    id: row.id as string,
    fullName: row.full_name ?? null,
    role: (row.role as UserRole) ?? "CLIENT",
    createdAt: row.created_at,
    lastSignInAt: lastSignInById.get(row.id as string) ?? null,
  }));
}

export async function repoUpdateUserRole(userId: string, role: UserRole) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) throw error;
}

/** Elimina el usuario en Auth (y normalmente el perfil en cascada). Requiere service role. */
export async function repoDeleteAuthUser(userId: string) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw error;
}

