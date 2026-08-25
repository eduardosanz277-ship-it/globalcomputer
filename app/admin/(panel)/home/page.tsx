/** Evita caché estática: métricas y “actividad reciente” deben reflejar el catálogo al visitar el home. */
export const revalidate = 0;
import {
  type DashboardProductRow,
} from "@/components/dashboard/DashboardTable";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { AdminHomeView } from "./AdminHomeView";

type ProductBrandRow = {
  brands:
    | { name: string; name_en: string | null }
    | { name: string; name_en: string | null }[]
    | null;
};

type ProductRecentRow = {
  id: string;
  name: string;
  name_en: string | null;
  price_client: number;
  stock: number;
  active: boolean;
  brands:
    | { name: string; name_en: string | null }
    | { name: string; name_en: string | null }[]
    | null;
};

function relationNames(
  rel:
    | { name: string; name_en: string | null }
    | { name: string; name_en: string | null }[]
    | null,
): { name: string; nameEn: string | null } {
  if (!rel) return { name: "", nameEn: null };
  const row = Array.isArray(rel) ? rel[0] : rel;
  if (!row) return { name: "", nameEn: null };
  return { name: row.name ?? "", nameEn: row.name_en ?? null };
}

async function countRows(
  label: string,
  query: PromiseLike<{
    count: number | null;
    error: { message: string } | null;
  }>,
): Promise<number> {
  const { count, error } = await query;
  if (error) {
    console.error(`[admin/home] ${label}`, error.message);
    return 0;
  }
  return count ?? 0;
}

export default async function AdminHomePage() {
  const supabase = createSupabaseAdminClient();

  const [
    totalProducts,
    totalBrands,
    totalCategories,
    totalUsers,
    activeProducts,
    noStockProducts,
    availableServices,
    activeSubscriptions,
    totalSubcategories,
    totalBrandTypes,
    totalGeneralCharacteristics,
    totalSpecificCharacteristics,
    conflictOrdersCount,
    recentProductsResult,
    productsByBrandResult,
  ] = await Promise.all([
    countRows(
      "total products",
      supabase.from("products").select("id", { head: true, count: "exact" }),
    ),
    countRows(
      "total brands",
      supabase.from("brands").select("id", { head: true, count: "exact" }),
    ),
    countRows(
      "total categories",
      supabase.from("categories").select("id", { head: true, count: "exact" }),
    ),
    countRows(
      "total users",
      supabase.from("profiles").select("id", { head: true, count: "exact" }),
    ),
    countRows(
      "active products",
      supabase
        .from("products")
        .select("id", { head: true, count: "exact" })
        .eq("active", true),
    ),
    countRows(
      "no stock products",
      supabase
        .from("products")
        .select("id", { head: true, count: "exact" })
        .lte("stock", 0),
    ),
    countRows(
      "available services",
      supabase.from("services").select("id", { head: true, count: "exact" }),
    ),
    countRows(
      "active subscriptions",
      supabase
        .from("profiles")
        .select("id", { head: true, count: "exact" })
        .eq("role", "BUSINESS")
        .eq("business_registration_status", "approved"),
    ),
    countRows(
      "total subcategories",
      supabase
        .from("subcategories")
        .select("id", { head: true, count: "exact" }),
    ),
    countRows(
      "total brand types",
      supabase.from("brand_types").select("id", { head: true, count: "exact" }),
    ),
    countRows(
      "total general characteristics",
      supabase
        .from("product_characteristics_general")
        .select("id", { head: true, count: "exact" }),
    ),
    countRows(
      "total specific characteristics",
      supabase
        .from("product_characteristics_specific")
        .select("id", { head: true, count: "exact" }),
    ),
    countRows(
      "conflict orders",
      supabase
        .from("store_orders")
        .select("id", { head: true, count: "exact" })
        .eq("inventory_status", "conflict"),
    ),
    /** Últimos N productos por fecha de última modificación (`updated_at`). */
    supabase
      .from("products")
      .select("id, name, name_en, price_client, stock, active, brands(name, name_en)")
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase.from("products").select("brands(name, name_en)"),
  ]);

  const recentProducts: DashboardProductRow[] = (
    recentProductsResult.data ?? ([] as ProductRecentRow[])
  ).map((row) => {
    const names = relationNames(row.brands);
    return {
      id: row.id,
      name: row.name,
      nameEn: row.name_en,
      brand: names.name,
      brandEn: names.nameEn,
      price: row.price_client,
      stock: row.stock,
      active: row.active,
    };
  });

  if (recentProductsResult.error) {
    console.error(
      "[admin/home] recent products",
      recentProductsResult.error.message,
    );
  }

  const productsByBrandMap = new Map<string, { total: number; brand: string; brandEn: string | null }>();
  const productsByBrand = (productsByBrandResult.data ??
    []) as ProductBrandRow[];
  for (const row of productsByBrand) {
    const names = relationNames(row.brands);
    const key = `${names.name}|||${names.nameEn ?? ""}`;
    const current = productsByBrandMap.get(key);
    productsByBrandMap.set(key, {
      total: (current?.total ?? 0) + 1,
      brand: names.name,
      brandEn: names.nameEn,
    });
  }

  if (productsByBrandResult.error) {
    console.error(
      "[admin/home] products by brand",
      productsByBrandResult.error.message,
    );
  }

  const chartItems = Array.from(productsByBrandMap.entries())
    .map(([, value]) => value)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const totalCharacteristics =
    totalGeneralCharacteristics + totalSpecificCharacteristics;

  return (
    <AdminHomeView
      totalProducts={totalProducts}
      totalBrands={totalBrands}
      totalCategories={totalCategories}
      totalUsers={totalUsers}
      activeProducts={activeProducts}
      noStockProducts={noStockProducts}
      availableServices={availableServices}
      activeSubscriptions={activeSubscriptions}
      totalSubcategories={totalSubcategories}
      totalBrandTypes={totalBrandTypes}
      totalCharacteristics={totalCharacteristics}
      conflictOrdersCount={conflictOrdersCount}
      chartItems={chartItems}
      recentProducts={recentProducts}
    />
  );
}
