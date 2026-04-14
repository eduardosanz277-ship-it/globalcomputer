import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Evita caché estática: métricas y “actividad reciente” deben reflejar el catálogo al visitar el home. */
export const revalidate = 0;
import { DashboardChart } from "@/components/dashboard/DashboardChart";
import {
  DashboardTable,
  type DashboardProductRow,
} from "@/components/dashboard/DashboardTable";
import { StatCard } from "@/components/dashboard/StatCard";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  Boxes,
  Building2,
  LayoutList,
  PackageCheck,
  PackageX,
  ShieldCheck,
  Tags,
  Users,
} from "lucide-react";

type ProductBrandRow = {
  brands: { name: string } | { name: string }[] | null;
};

type ProductRecentRow = {
  id: string;
  name: string;
  price: number;
  stock: number;
  active: boolean;
  brands: { name: string } | { name: string }[] | null;
};

function relationName(
  rel: { name: string } | { name: string }[] | null,
): string {
  if (!rel) return "Sin marca";
  if (Array.isArray(rel)) return rel[0]?.name ?? "Sin marca";
  return rel.name ?? "Sin marca";
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
    /** Últimos N productos por fecha de última modificación (`updated_at`). */
    supabase
      .from("products")
      .select("id, name, price, stock, active, brands(name)")
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase.from("products").select("brands(name)"),
  ]);

  const recentProducts: DashboardProductRow[] = (
    recentProductsResult.data ?? ([] as ProductRecentRow[])
  ).map((row) => ({
    id: row.id,
    name: row.name,
    brand: relationName(row.brands),
    price: row.price,
    stock: row.stock,
    active: row.active,
  }));

  if (recentProductsResult.error) {
    console.error(
      "[admin/home] recent products",
      recentProductsResult.error.message,
    );
  }

  const productsByBrandMap = new Map<string, number>();
  const productsByBrand = (productsByBrandResult.data ??
    []) as ProductBrandRow[];
  for (const row of productsByBrand) {
    const brand = relationName(row.brands);
    productsByBrandMap.set(brand, (productsByBrandMap.get(brand) ?? 0) + 1);
  }

  if (productsByBrandResult.error) {
    console.error(
      "[admin/home] products by brand",
      productsByBrandResult.error.message,
    );
  }

  const chartItems = Array.from(productsByBrandMap.entries())
    .map(([brand, total]) => ({ brand, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const totalCharacteristics =
    totalGeneralCharacteristics + totalSpecificCharacteristics;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Vista general del estado del e-commerce y su catálogo.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total de productos"
          value={totalProducts}
          icon={Boxes}
        />
        <StatCard label="Total de marcas" value={totalBrands} icon={Tags} />
        <StatCard
          label="Total de categorias"
          value={totalCategories}
          icon={LayoutList}
        />
        <StatCard label="Total de usuarios" value={totalUsers} icon={Users} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Productos activos"
          value={activeProducts}
          icon={PackageCheck}
          hint="Disponibles en catalogo"
        />
        <StatCard
          label="Productos sin stock"
          value={noStockProducts}
          icon={PackageX}
          hint="Stock en cero o negativo"
        />
        <StatCard
          label="Servicios disponibles"
          value={availableServices}
          icon={ShieldCheck}
        />
        <StatCard
          label="Suscripciones activas"
          value={activeSubscriptions}
          icon={Building2}
          hint="Empresas aprobadas"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <DashboardChart items={chartItems} />
        </div>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Resumen del catalogo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
              <span className="text-sm text-muted-foreground">Categorias</span>
              <span className="text-base font-semibold">{totalCategories}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
              <span className="text-sm text-muted-foreground">
                Subcategorias
              </span>
              <span className="text-base font-semibold">
                {totalSubcategories}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
              <span className="text-sm text-muted-foreground">
                Tipos por marca
              </span>
              <span className="text-base font-semibold">{totalBrandTypes}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
              <span className="text-sm text-muted-foreground">
                Caracteristicas registradas
              </span>
              <span className="text-base font-semibold">
                {totalCharacteristics}
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <DashboardTable rows={recentProducts} />
      </section>
    </div>
  );
}
