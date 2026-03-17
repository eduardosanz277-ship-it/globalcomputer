import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { AdminUser } from "./users.types";
import type { UserRole } from "@/modules/auth/auth.types";

export async function repoGetAllUsers(): Promise<AdminUser[]> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    id: row.id as string,
    fullName: row.full_name ?? null,
    role: (row.role as UserRole) ?? "USER",
    createdAt: row.created_at,
  }));
}

export async function repoUpdateUserRole(userId: string, role: UserRole) {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) throw error;
}

