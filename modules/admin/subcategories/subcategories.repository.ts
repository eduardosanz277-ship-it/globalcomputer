import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { AdminSubcategory } from "@/modules/admin/categories/categories.types";
import type {
  SubcategoryAdmin,
  SubcategoryAdminInsert,
  SubcategoryAdminUpdate,
} from "./subcategories.types";

type SubcategoryRow = {
  id: string;
  category_id: string;
  name: string;
  name_en?: string | null;
  slug: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  categories: { name: string } | { name: string }[] | null;
};

function categoryNameFromRow(row: SubcategoryRow): string {
  const c = row.categories;
  if (!c) return "—";
  if (Array.isArray(c)) return c[0]?.name ?? "—";
  return c.name ?? "—";
}

function mapSubcategoryAdminRow(row: SubcategoryRow): SubcategoryAdmin {
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: categoryNameFromRow(row),
    name: row.name,
    nameEn: row.name_en ?? null,
    slug: row.slug,
    active: row.deleted_at == null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function deletedAtFromActive(active: boolean): string | null {
  return active ? null : new Date().toISOString();
}

/** Listado para productos (solo subcategorías activas). */
export async function repoListSubcategoriesForProductForm(): Promise<
  AdminSubcategory[]
> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subcategories")
    .select("id, name, slug, category_id")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    categoryId: row.category_id as string,
    slug: row.slug as string,
  }));
}

export async function repoGetSubcategoryCategoryId(
  subcategoryId: string,
): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subcategories")
    .select("category_id")
    .eq("id", subcategoryId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  if (!data?.category_id) return null;
  return data.category_id as string;
}

export async function repoListAllSubcategoriesAdmin(): Promise<
  SubcategoryAdmin[]
> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subcategories")
    .select(
      "id, category_id, name, name_en, slug, deleted_at, created_at, updated_at, categories ( name )",
    )
    .order("name", { ascending: true });

  if (error) throw error;
  const mapped = (data as SubcategoryRow[]).map(mapSubcategoryAdminRow);
  return mapped.sort((a, b) => {
    const byCat = a.categoryName.localeCompare(b.categoryName, "es");
    if (byCat !== 0) return byCat;
    return a.name.localeCompare(b.name, "es");
  });
}

export async function repoCreateSubcategoryAdmin(
  payload: SubcategoryAdminInsert,
): Promise<SubcategoryAdmin> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subcategories")
    .insert({
      category_id: payload.categoryId,
      name: payload.name,
      name_en: payload.nameEn,
      slug: payload.slug,
      deleted_at: deletedAtFromActive(payload.active),
    })
    .select(
      "id, category_id, name, name_en, deleted_at, created_at, updated_at, categories ( name )",
    )
    .single();

  if (error) throw error;
  return mapSubcategoryAdminRow(data as SubcategoryRow);
}

export async function repoUpdateSubcategoryAdmin(
  id: string,
  payload: SubcategoryAdminUpdate,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("subcategories")
    .update({
      category_id: payload.categoryId,
      name: payload.name,
      name_en: payload.nameEn,
      slug: payload.slug,
      deleted_at: deletedAtFromActive(payload.active),
    })
    .eq("id", id);

  if (error) throw error;
}

export async function repoSoftDeleteSubcategoryAdmin(id: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("subcategories")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}
