import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  parseAdminTableQuery,
  readAdminTableParam,
  type AdminTableSearchParams,
} from "@/lib/admin/server-table";
import { getAllBrandTypesService } from "@/modules/admin/brand-types/brand-types.service";
import { getAllBrandsService } from "@/modules/admin/brands/brands.service";
import { getCatalogCategoriesForAdminService } from "@/modules/admin/categories/categories.service";
import {
  getProductAccessoryOptionsService,
  getProductsPageService,
} from "@/modules/admin/products/products.service";
import { getAllSpecificCharacteristicsService } from "@/modules/admin/specific-characteristics/specific-characteristics.service";
import { isGlobalAdmin } from "@/modules/auth/auth.guards";
import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import { redirect } from "next/navigation";
import { AdminProductsTable } from "./AdminProductsTable";
import { ProductsPageHeader } from "./ProductsPageHeader";

/** Columnas ordenables de `AdminProductsTable`. */
const PRODUCTS_SORT_IDS = ["product", "brand", "priceClient", "stock", "active"] as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  searchParams?: Promise<AdminTableSearchParams>;
};

function readUuidParam(params: AdminTableSearchParams, key: string): string | null {
  const value = readAdminTableParam(params, key);
  return UUID_RE.test(value) ? value : null;
}

async function AdminProductsTableSection({
  searchParams,
}: {
  searchParams: AdminTableSearchParams;
}) {
  const activeParam = readAdminTableParam(searchParams, "active");
  const stockParam = readAdminTableParam(searchParams, "stock");
  const [
    page,
    accessoryOptions,
    brands,
    brandTypes,
    specificCharacteristics,
    [categories, subcategories],
  ] = await Promise.all([
    getProductsPageService({
      ...parseAdminTableQuery(searchParams, PRODUCTS_SORT_IDS),
      brandId: readUuidParam(searchParams, "brand"),
      brandTypeId: readUuidParam(searchParams, "type"),
      active: activeParam === "active" || activeParam === "inactive" ? activeParam : null,
      stock:
        stockParam === "inStock" || stockParam === "lowStock" || stockParam === "outOfStock"
          ? stockParam
          : null,
    }),
    getProductAccessoryOptionsService(),
    getAllBrandsService(),
    getAllBrandTypesService(),
    getAllSpecificCharacteristicsService(),
    getCatalogCategoriesForAdminService(),
  ]);

  return (
    <AdminProductsTable
      page={page}
      accessoryOptions={accessoryOptions}
      brands={brands}
      brandTypes={brandTypes}
      specificCharacteristics={specificCharacteristics}
      categories={categories}
      subcategories={subcategories}
    />
  );
}

export default async function AdminProductsPage({ searchParams }: Props) {
  const current = await getCurrentUserStrictService();
  if (!isGlobalAdmin(current?.role)) {
    redirect("/admin");
  }
  const resolvedSearchParams = (await searchParams) ?? {};

  return (
    <Card className="w-full">
      <CardContent>
        <ProductsPageHeader />

        <hr className="border-border" />

        <Suspense
          fallback={
            <AdminProductsTable
              page={{ rows: [], rowCount: 0, pageIndex: 0 }}
              accessoryOptions={[]}
              brands={[]}
              brandTypes={[]}
              specificCharacteristics={[]}
              categories={[]}
              subcategories={[]}
              isLoading
            />
          }
        >
          <AdminProductsTableSection searchParams={resolvedSearchParams} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
