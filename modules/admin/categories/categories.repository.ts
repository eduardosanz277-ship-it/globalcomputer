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
  name_en?: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapCategoryAdminRow(row: CategoryRow): CategoryAdmin {
  return {
    id: row.id,
    name: row.name,
    nameEn: row.name_en ?? null,
    active: row.deleted_at == null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

let cachedNameEnColumn: boolean | null = null;

async function ensureNameEnColumnExists(): Promise<boolean> {
  if (cachedNameEnColumn !== null) return cachedNameEnColumn;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("categories")
    .select("name_en")
    .limit(0);
  if (error && error.code === "42703") {
    cachedNameEnColumn = false;
    return false;
  }
  if (error) throw error;
  cachedNameEnColumn = true;
  return true;
}
function deletedAtFromActive(active: boolean): string | null {
  return active ? null : new Date().toISOString();
}

/** Listado para desplegables de productos (solo categorías activas). */
export async function repoListCategoriesForAdmin(): Promise<AdminCategory[]> {
  const supabase = createSupabaseAdminClient();
  const includeNameEn = await ensureNameEnColumnExists();
  const selectFields = includeNameEn ? "id, name, name_en" : "id, name";
  const { data, error } = await supabase
    .from("categories")
    .select(selectFields)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    nameEn: includeNameEn ? (row as CategoryRow).name_en ?? null : null,
  }));
}

/** Todas las categorías (activas e inactivas) para la tabla de administración. */
export async function repoListAllCategoriesAdmin(): Promise<CategoryAdmin[]> {
  const supabase = createSupabaseAdminClient();
  const includeNameEn = await ensureNameEnColumnExists();
  const selectFields = includeNameEn
    ? "id, name, name_en, deleted_at, created_at, updated_at"
    : "id, name, deleted_at, created_at, updated_at";
  const { data, error } = await supabase
    .from("categories")
    .select(selectFields)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as CategoryRow[]).map(mapCategoryAdminRow);
}

export async function repoCreateCategoryAdmin(
  payload: CategoryAdminInsert,
): Promise<CategoryAdmin> {
  const supabase = createSupabaseAdminClient();
  const includeNameEn = await ensureNameEnColumnExists();
  const insertPayload: Record<string, unknown> = {
    name: payload.name,
    deleted_at: deletedAtFromActive(payload.active),
  };
  if (includeNameEn) {
    insertPayload.name_en = payload.nameEn;
  }
  const selectFields = includeNameEn
    ? "id, name, name_en, deleted_at, created_at, updated_at"
    : "id, name, deleted_at, created_at, updated_at";
  const { data, error } = await supabase
    .from("categories")
    .insert(insertPayload)
    .select(selectFields)
    .single();

  if (error) throw error;
  return mapCategoryAdminRow(data as CategoryRow);
}

export async function repoUpdateCategoryAdmin(
  id: string,
  payload: CategoryAdminUpdate,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const includeNameEn = await ensureNameEnColumnExists();
  const updatePayload: Record<string, unknown> = {
    name: payload.name,
    deleted_at: deletedAtFromActive(payload.active),
  };
  if (includeNameEn) {
    updatePayload.name_en = payload.nameEn;
  }
  const { error } = await supabase
    .from("categories")
    .update(updatePayload)
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
