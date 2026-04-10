import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type {
  AdminCategory,
  CategoryAdmin,
  CategoryAdminInsert,
  CategoryAdminUpdate,
} from "./categories.types";

type CategoryRow = {
  id: string;
  name: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapCategoryAdminRow(row: CategoryRow): CategoryAdmin {
  return {
    id: row.id,
    name: row.name,
    active: row.deleted_at == null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function deletedAtFromActive(active: boolean): string | null {
  return active ? null : new Date().toISOString();
}

/** Listado para desplegables de productos (solo categorías activas). */
export async function repoListCategoriesForAdmin(): Promise<AdminCategory[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
  }));
}

/** Todas las categorías (activas e inactivas) para la tabla de administración. */
export async function repoListAllCategoriesAdmin(): Promise<CategoryAdmin[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, deleted_at, created_at, updated_at")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as CategoryRow[]).map(mapCategoryAdminRow);
}

export async function repoCreateCategoryAdmin(
  payload: CategoryAdminInsert,
): Promise<CategoryAdmin> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: payload.name,
      deleted_at: deletedAtFromActive(payload.active),
    })
    .select("id, name, deleted_at, created_at, updated_at")
    .single();

  if (error) throw error;
  return mapCategoryAdminRow(data as CategoryRow);
}

export async function repoUpdateCategoryAdmin(
  id: string,
  payload: CategoryAdminUpdate,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("categories")
    .update({
      name: payload.name,
      deleted_at: deletedAtFromActive(payload.active),
    })
    .eq("id", id);

  if (error) throw error;
}

/** Archiva la categoría (soft delete). */
export async function repoSoftDeleteCategoryAdmin(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("categories")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}
