import { cache } from "react";
import { getCatalogSupabase } from "@/lib/supabaseCatalogClient";
import { slugify } from "@/lib/slugify";

export type StorefrontCategoryWithSubcategories = {
  id: string;
  name: string;
  slug: string;
  subcategories: { id: string; name: string; slug: string }[];
};

/**
 * Categorías activas con sus subcategorías (vitrina). Una consulta por petición.
 */
const normalizeSlug = (name: string, slug: string | null | undefined) =>
  slug && slug.trim() ? slug : slugify(name);

export const getStorefrontCategoriesWithSubcategories = cache(
  async (): Promise<StorefrontCategoryWithSubcategories[]> => {
    const supabase = await getCatalogSupabase();

    const [categoriesResult, subcategoriesResult] = await Promise.all([
      supabase
        .from("categories")
        .select("id, name, slug")
        .is("deleted_at", null)
        .order("name", { ascending: true }),
      supabase
        .from("subcategories")
        .select("id, name, slug, category_id")
        .is("deleted_at", null)
        .order("name", { ascending: true }),
    ]);

    if (categoriesResult.error) throw categoriesResult.error;
    if (subcategoriesResult.error) throw subcategoriesResult.error;

    const byCategory = new Map<string, { id: string; name: string; slug: string }[]>();
    for (const row of subcategoriesResult.data ?? []) {
      const categoryId = row.category_id as string;
      const list = byCategory.get(categoryId) ?? [];
      list.push({
        id: row.id as string,
        name: row.name as string,
        slug: normalizeSlug(row.name as string, row.slug as string | null),
      });
      byCategory.set(categoryId, list);
    }

    return (categoriesResult.data ?? []).map((c) => ({
      id: c.id as string,
      name: c.name as string,
      slug: normalizeSlug(c.name as string, c.slug as string | null),
      subcategories: byCategory.get(c.id as string) ?? [],
    }));
  },
);

/** Categoría activa por id (vitrina). */
export const getStorefrontCategoryById = cache(
  async (id: string): Promise<{ id: string; name: string; slug: string } | null> => {
    const supabase = await getCatalogSupabase();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id as string,
      name: data.name as string,
      slug: normalizeSlug(data.name as string, data.slug as string | null),
    };
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
  ): Promise<{ id: string; name: string; slug: string } | null> => {
    const supabase = await getCatalogSupabase();
    const { data, error } = await supabase
      .from("subcategories")
      .select("id, name, slug, category_id")
      .eq("id", subcategoryId)
      .eq("category_id", categoryId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id as string,
      name: data.name as string,
      slug: normalizeSlug(data.name as string, data.slug as string | null),
    };
  },
);

export const getStorefrontCategoryBySlug = cache(
  async (slug: string): Promise<{ id: string; name: string; slug: string } | null> => {
    const supabase = await getCatalogSupabase();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug")
      .eq("slug", slug)
      .is("deleted_at", null)
      .maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id as string,
      name: data.name as string,
      slug: normalizeSlug(data.name as string, data.slug as string | null),
    };
  },
);

export const getStorefrontSubcategoryInCategoryBySlug = cache(
  async (
    categoryId: string,
    slug: string,
  ): Promise<{ id: string; name: string; slug: string } | null> => {
    const supabase = await getCatalogSupabase();
    const { data, error } = await supabase
      .from("subcategories")
      .select("id, name, slug, category_id")
      .eq("category_id", categoryId)
      .eq("slug", slug)
      .is("deleted_at", null)
      .maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id as string,
      name: data.name as string,
      slug: normalizeSlug(data.name as string, data.slug as string | null),
    };
  },
);
