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
  slug: string;
  deleted_at: string | null;
  is_accessory_type: boolean;
  created_at: string;
  updated_at: string;
};

function mapCategoryAdminRow(row: CategoryRow): CategoryAdmin {
  return {
    id: row.id,
    name: row.name,
    nameEn: row.name_en ?? null,
    slug: row.slug,
    active: row.deleted_at == null,
    isAccessoryType: row.is_accessory_type,
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
  if (includeNameEn) {
    const { data, error } = await supabase
      .from("categories")
      .select("id,name,name_en,slug,is_accessory_type")
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      nameEn: row.name_en ?? null,
      slug: row.slug,
      isAccessoryType: Boolean(row.is_accessory_type),
    }));
  }

  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,is_accessory_type")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    nameEn: null,
    slug: row.slug,
    isAccessoryType: Boolean(row.is_accessory_type),
  }));
}

/** Todas las categorías (activas e inactivas) para la tabla de administración. */
export async function repoListAllCategoriesAdmin(): Promise<CategoryAdmin[]> {
  const supabase = createSupabaseAdminClient();
  const includeNameEn = await ensureNameEnColumnExists();
  if (includeNameEn) {
    const { data, error } = await supabase
      .from("categories")
      .select(
        "id,name,name_en,slug,deleted_at,is_accessory_type,created_at,updated_at",
      )
      .order("name", { ascending: true });

    if (error) throw error;
    return (data ?? []).map((row) => mapCategoryAdminRow(row as CategoryRow));
  }

  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,deleted_at,is_accessory_type,created_at,updated_at")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) =>
    mapCategoryAdminRow({ ...(row as CategoryRow), name_en: null }),
  );
}

export async function repoCreateCategoryAdmin(
  payload: CategoryAdminInsert,
): Promise<CategoryAdmin> {
  const supabase = createSupabaseAdminClient();
  const includeNameEn = await ensureNameEnColumnExists();
  const insertPayload: Record<string, unknown> = {
    name: payload.name,
    slug: payload.slug,
    deleted_at: deletedAtFromActive(payload.active),
    is_accessory_type: payload.isAccessoryType,
  };
  if (includeNameEn) {
    insertPayload.name_en = payload.nameEn;
  }
  if (includeNameEn) {
    const { data, error } = await supabase
      .from("categories")
      .insert(insertPayload)
      .select(
        "id,name,name_en,slug,deleted_at,is_accessory_type,created_at,updated_at",
      )
      .single();

    if (error) throw error;
    return mapCategoryAdminRow(data as CategoryRow);
  }

  const { data, error } = await supabase
    .from("categories")
    .insert(insertPayload)
    .select("id,name,slug,deleted_at,is_accessory_type,created_at,updated_at")
    .single();

  if (error) throw error;
  return mapCategoryAdminRow({ ...(data as CategoryRow), name_en: null });
}

export async function repoUpdateCategoryAdmin(
  id: string,
  payload: CategoryAdminUpdate,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const includeNameEn = await ensureNameEnColumnExists();
  const updatePayload: Record<string, unknown> = {
    name: payload.name,
    slug: payload.slug,
    deleted_at: deletedAtFromActive(payload.active),
    is_accessory_type: payload.isAccessoryType,
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
