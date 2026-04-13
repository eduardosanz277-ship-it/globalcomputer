import { cache } from "react";
import { getCatalogSupabase } from "@/lib/supabaseCatalogClient";

export type StorefrontCategoryWithSubcategories = {
  id: string;
  name: string;
  subcategories: { id: string; name: string }[];
};

/**
 * Categorías activas con sus subcategorías (vitrina). Una consulta por petición.
 */
export const getStorefrontCategoriesWithSubcategories = cache(
  async (): Promise<StorefrontCategoryWithSubcategories[]> => {
    const supabase = await getCatalogSupabase();

    const [categoriesResult, subcategoriesResult] = await Promise.all([
      supabase
        .from("categories")
        .select("id, name")
        .is("deleted_at", null)
        .order("name", { ascending: true }),
      supabase
        .from("subcategories")
        .select("id, name, category_id")
        .is("deleted_at", null)
        .order("name", { ascending: true }),
    ]);

    if (categoriesResult.error) throw categoriesResult.error;
    if (subcategoriesResult.error) throw subcategoriesResult.error;

    const byCategory = new Map<string, { id: string; name: string }[]>();
    for (const row of subcategoriesResult.data ?? []) {
      const categoryId = row.category_id as string;
      const list = byCategory.get(categoryId) ?? [];
      list.push({ id: row.id as string, name: row.name as string });
      byCategory.set(categoryId, list);
    }

    return (categoriesResult.data ?? []).map((c) => ({
      id: c.id as string,
      name: c.name as string,
      subcategories: byCategory.get(c.id as string) ?? [],
    }));
  },
);

/** Categoría activa por id (vitrina). */
export const getStorefrontCategoryById = cache(
  async (id: string): Promise<{ id: string; name: string } | null> => {
    const supabase = await getCatalogSupabase();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error || !data) return null;
    return { id: data.id as string, name: data.name as string };
  },
);

/**
 * Subcategoría activa que pertenece a la categoría indicada (vitrina).
 * Útil para URLs `/catalogo/[categoryId]/[subcategoryId]`.
 */
export const getStorefrontSubcategoryInCategory = cache(
  async (
    categoryId: string,
    subcategoryId: string,
  ): Promise<{ id: string; name: string } | null> => {
    const supabase = await getCatalogSupabase();
    const { data, error } = await supabase
      .from("subcategories")
      .select("id, name, category_id")
      .eq("id", subcategoryId)
      .eq("category_id", categoryId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error || !data) return null;
    return { id: data.id as string, name: data.name as string };
  },
);
