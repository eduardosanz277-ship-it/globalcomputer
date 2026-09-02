import { cache } from "react";
import { assertRemoteOk, failOnNetworkError } from "@/lib/errors/rsc-network-error";
import { getCatalogSupabase } from "@/lib/supabaseCatalogClient";
import { slugify } from "@/lib/slugify";

export type StorefrontCategoryWithSubcategories = {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string;
  subcategories: { id: string; name: string; nameEn: string | null; slug: string }[];
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
        .select("id, name, name_en, slug")
        .is("deleted_at", null)
        .order("name", { ascending: true }),
      supabase
        .from("subcategories")
        .select("id, name, name_en, slug, category_id")
        .is("deleted_at", null)
        .order("name", { ascending: true }),
    ]);

    assertRemoteOk(categoriesResult.error);
    assertRemoteOk(subcategoriesResult.error);

    const byCategory = new Map<
      string,
      { id: string; name: string; nameEn: string | null; slug: string }[]
    >();
    for (const row of subcategoriesResult.data ?? []) {
      const categoryId = row.category_id as string;
      const list = byCategory.get(categoryId) ?? [];
      list.push({
        id: row.id as string,
        name: row.name as string,
        nameEn:
          row.name_en != null && String(row.name_en).trim() !== ""
            ? String(row.name_en)
            : null,
        slug: normalizeSlug(row.name as string, row.slug as string | null),
      });
      byCategory.set(categoryId, list);
    }

    return (categoriesResult.data ?? []).map((c) => ({
      id: c.id as string,
      name: c.name as string,
      nameEn:
        c.name_en != null && String(c.name_en).trim() !== ""
          ? String(c.name_en)
          : null,
      slug: normalizeSlug(c.name as string, c.slug as string | null),
      subcategories: byCategory.get(c.id as string) ?? [],
    }));
  },
);

/** Categoría activa por id (vitrina). */
export const getStorefrontCategoryById = cache(
  async (
    id: string,
  ): Promise<{ id: string; name: string; nameEn: string | null; slug: string } | null> => {
    const supabase = await getCatalogSupabase();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, name_en, slug")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      failOnNetworkError(error);
      return null;
    }
    if (!data) return null;
    return {
      id: data.id as string,
      name: data.name as string,
      nameEn:
        data.name_en != null && String(data.name_en).trim() !== ""
          ? String(data.name_en)
          : null,
      slug: normalizeSlug(data.name as string, data.slug as string | null),
    };
  },
);

/** Subcategoría activa por id (incluye `category_id` padre). */
export const getStorefrontSubcategoryById = cache(
  async (
    id: string,
  ): Promise<{
    id: string;
    name: string;
    nameEn: string | null;
    slug: string;
    categoryId: string;
  } | null> => {
    const supabase = await getCatalogSupabase();
    const { data, error } = await supabase
      .from("subcategories")
      .select("id, name, name_en, slug, category_id")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      failOnNetworkError(error);
      return null;
    }
    if (!data) return null;
    return {
      id: data.id as string,
      name: data.name as string,
      nameEn:
        data.name_en != null && String(data.name_en).trim() !== ""
          ? String(data.name_en)
          : null,
      slug: normalizeSlug(data.name as string, data.slug as string | null),
      categoryId: data.category_id as string,
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
  ): Promise<{ id: string; name: string; nameEn: string | null; slug: string } | null> => {
    const supabase = await getCatalogSupabase();
    const { data, error } = await supabase
      .from("subcategories")
      .select("id, name, name_en, slug, category_id")
      .eq("id", subcategoryId)
      .eq("category_id", categoryId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      failOnNetworkError(error);
      return null;
    }
    if (!data) return null;
    return {
      id: data.id as string,
      name: data.name as string,
      nameEn:
        data.name_en != null && String(data.name_en).trim() !== ""
          ? String(data.name_en)
          : null,
      slug: normalizeSlug(data.name as string, data.slug as string | null),
    };
  },
);

export const getStorefrontCategoryBySlug = cache(
  async (
    slug: string,
  ): Promise<{ id: string; name: string; nameEn: string | null; slug: string } | null> => {
    const supabase = await getCatalogSupabase();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, name_en, slug")
      .eq("slug", slug)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) {
      failOnNetworkError(error);
      return null;
    }
    if (!data) return null;
    return {
      id: data.id as string,
      name: data.name as string,
      nameEn:
        data.name_en != null && String(data.name_en).trim() !== ""
          ? String(data.name_en)
          : null,
      slug: normalizeSlug(data.name as string, data.slug as string | null),
    };
  },
);

export const getStorefrontSubcategoryInCategoryBySlug = cache(
  async (
    categoryId: string,
    slug: string,
  ): Promise<{ id: string; name: string; nameEn: string | null; slug: string } | null> => {
    const supabase = await getCatalogSupabase();
    const { data, error } = await supabase
      .from("subcategories")
      .select("id, name, name_en, slug, category_id")
      .eq("category_id", categoryId)
      .eq("slug", slug)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) {
      failOnNetworkError(error);
      return null;
    }
    if (!data) return null;
    return {
      id: data.id as string,
      name: data.name as string,
      nameEn:
        data.name_en != null && String(data.name_en).trim() !== ""
          ? String(data.name_en)
          : null,
      slug: normalizeSlug(data.name as string, data.slug as string | null),
    };
  },
);
