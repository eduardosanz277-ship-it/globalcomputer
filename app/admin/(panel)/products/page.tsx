import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getAllBrandTypesService } from "@/modules/admin/brand-types/brand-types.service";
import { getAllBrandsService } from "@/modules/admin/brands/brands.service";
import { getCatalogCategoriesForAdminService } from "@/modules/admin/categories/categories.service";
import { getAllProductsService } from "@/modules/admin/products/products.service";
import { getAllSpecificCharacteristicsService } from "@/modules/admin/specific-characteristics/specific-characteristics.service";
import { isGlobalAdmin } from "@/modules/auth/auth.guards";
import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import { redirect } from "next/navigation";
import { AdminProductsTable } from "./AdminProductsTable";
import { ProductsPageHeader } from "./ProductsPageHeader";

async function AdminProductsTableSection() {
  const [
    products,
    brands,
    brandTypes,
    specificCharacteristics,
    [categories, subcategories],
  ] = await Promise.all([
    getAllProductsService(),
    getAllBrandsService(),
    getAllBrandTypesService(),
    getAllSpecificCharacteristicsService(),
    getCatalogCategoriesForAdminService(),
  ]);

  return (
    <AdminProductsTable
      products={products}
      brands={brands}
      brandTypes={brandTypes}
      specificCharacteristics={specificCharacteristics}
      categories={categories}
      subcategories={subcategories}
    />
  );
}

export default async function AdminProductsPage() {
  const current = await getCurrentUserStrictService();
  if (!isGlobalAdmin(current?.role)) {
    redirect("/admin");
  }

  return (
    <Card className="w-full">
      <CardContent>
        <ProductsPageHeader />

        <hr className="border-border" />

        <Suspense
          fallback={
            <AdminProductsTable
              products={[]}
              brands={[]}
              brandTypes={[]}
              specificCharacteristics={[]}
              categories={[]}
              subcategories={[]}
              isLoading
            />
          }
        >
          <AdminProductsTableSection />
        </Suspense>
      </CardContent>
    </Card>
  );
}
