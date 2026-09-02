import { cache } from "react";
import { isNetworkActionError } from "@/lib/errors/network-action-error";
import { throwRemoteError } from "@/lib/errors/rsc-network-error";
import { getCatalogSupabase } from "@/lib/supabaseCatalogClient";
import { slugify } from "@/lib/slugify";
import {
  NavigationBrand,
  NavigationBrandType,
  NavigationCatalogCategory,
  NavigationCharacteristicGeneral,
  NavigationData,
  NavigationService,
} from "./navigation.types";

const normalizeSlug = (name: string, slug: string | null | undefined) =>
  slug && slug.trim() ? slug : slugify(name);

/**
 * Una sola ejecución por petición: evita duplicar consultas cuando varios
 * componentes del mismo render llaman (p. ej. `page.tsx` + `StoreHero`).
 */
export const getNavigationData = cache(async (): Promise<NavigationData> => {
  const supabase = await getCatalogSupabase();

  const [
    generalResult,
    specificResult,
    brandsResult,
    brandTypesResult,
    servicesResult,
    categoriesResult,
    subcategoriesResult,
  ] = await Promise.all([
    supabase
      .from("product_characteristics_general")
      .select("id, name, name_en, slug")
      .eq("active", true)
      .order("name"),
    supabase
      .from("product_characteristics_specific")
      .select("id, name, name_en, slug, general_id")
      .eq("active", true)
      .order("name"),
    supabase
      .from("brands")
      .select("id, name, name_en, slug")
      .eq("active", true)
      .order("name"),
    supabase
      .from("brand_types")
      .select("id, name, name_en, brand_id, slug")
      .eq("active", true)
      .order("name"),
    supabase
      .from("services")
      .select("id, name, name_en, description, slug")
      .order("name"),
    supabase
      .from("categories")
      .select("id, name, name_en, slug")
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("subcategories")
      .select("id, name, name_en, slug, category_id")
      .is("deleted_at", null)
      .order("name"),
  ]);

  for (const result of [
    generalResult,
    specificResult,
    brandsResult,
    brandTypesResult,
    servicesResult,
    categoriesResult,
    subcategoriesResult,
  ]) {
    if (result.error && isNetworkActionError(result.error)) {
      throwRemoteError(result.error);
    }
  }

  if (generalResult.error) {
    console.warn(
      "Navigation: failed to load product_characteristics_general",
      generalResult.error,
    );
  }
  if (specificResult.error) {
    console.warn(
      "Navigation: failed to load product_characteristics_specific",
      specificResult.error,
    );
  }
  if (brandsResult.error) {
    console.warn("Navigation: failed to load brands", brandsResult.error);
  }
  if (brandTypesResult.error) {
    console.warn(
      "Navigation: failed to load brand types",
      brandTypesResult.error,
    );
  }
  if (servicesResult.error) {
    console.warn("Navigation: failed to load services", servicesResult.error);
  }
  if (categoriesResult.error) {
    console.warn("Navigation: failed to load categories", categoriesResult.error);
  }
  if (subcategoriesResult.error) {
    console.warn(
      "Navigation: failed to load subcategories",
      subcategoriesResult.error,
    );
  }

  const generalMap = new Map<string, NavigationCharacteristicGeneral>();
  const generalRows = generalResult.data ?? [];
  for (const row of generalRows) {
    generalMap.set(row.id, {
      id: row.id,
      name: row.name,
      slug: normalizeSlug(row.name, row.slug ?? null),
      nameEn: row.name_en ?? null,
      specifics: [],
    });
  }

  const specificRows = specificResult.data ?? [];
  for (const row of specificRows) {
    const general = generalMap.get(row.general_id);
    if (general) {
      general.specifics.push({
        id: row.id,
        name: row.name,
        slug: normalizeSlug(row.name, row.slug ?? null),
        nameEn: row.name_en ?? null,
      });
    }
  }

  const brandsMap = new Map<string, NavigationBrand>();
  const brandsRows = brandsResult.data ?? [];
  for (const row of brandsRows) {
    brandsMap.set(row.id, {
      id: row.id,
      name: row.name,
      slug: normalizeSlug(row.name, row.slug ?? null),
      nameEn: row.name_en ?? null,
      brandTypes: [],
    });
  }

  const brandTypeRows = brandTypesResult.data ?? [];
  for (const row of brandTypeRows) {
    const brand = brandsMap.get(row.brand_id);
    if (brand) {
      brand.brandTypes.push({
        id: row.id,
        name: row.name,
        slug: normalizeSlug(row.name, row.slug ?? null),
        nameEn: row.name_en ?? null,
      });
    }
  }

  const servicesRows = servicesResult.data ?? [];
  const services: NavigationService[] = servicesRows.map((row) => ({
    id: row.id,
    name: row.name,
    nameEn: row.name_en ?? null,
    description: row.description,
    slug: normalizeSlug(row.name, row.slug),
  }));

  const categoriesMap = new Map<string, NavigationCatalogCategory>();
  const categoryRows = categoriesResult.data ?? [];
  for (const row of categoryRows) {
    categoriesMap.set(row.id, {
      id: row.id,
      name: row.name,
      slug: normalizeSlug(row.name, row.slug),
      nameEn: row.name_en ?? null,
      subcategories: [],
    });
  }
  const subcategoryRows = subcategoriesResult.data ?? [];
  for (const row of subcategoryRows) {
    const cat = categoriesMap.get(row.category_id);
    if (cat) {
      cat.subcategories.push({
        id: row.id,
        name: row.name,
        slug: normalizeSlug(row.name, row.slug),
        nameEn: row.name_en ?? null,
      });
    }
  }

  return {
    characteristicsGeneral: Array.from(generalMap.values()),
    brands: Array.from(brandsMap.values()),
    services,
    catalogCategories: Array.from(categoriesMap.values()),
  };
});
