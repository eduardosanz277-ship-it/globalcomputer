import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getAllBrandTypesService } from "@/modules/admin/brand-types/brand-types.service";
import { getAllBrandsService } from "@/modules/admin/brands/brands.service";
import { getAllProductsService } from "@/modules/admin/products/products.service";
import { getAllSpecificCharacteristicsService } from "@/modules/admin/specific-characteristics/specific-characteristics.service";
import { isGlobalAdmin } from "@/modules/auth/auth.guards";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { redirect } from "next/navigation";
import { AdminProductsTable } from "./AdminProductsTable";

async function AdminProductsTableSection() {
  const [products, brands, brandTypes, specificCharacteristics] = await Promise.all([
    getAllProductsService(),
    getAllBrandsService(),
    getAllBrandTypesService(),
    getAllSpecificCharacteristicsService(),
  ]);

  return (
    <AdminProductsTable
      products={products}
      brands={brands}
      brandTypes={brandTypes}
      specificCharacteristics={specificCharacteristics}
    />
  );
}

export default async function AdminProductsPage() {
  const current = await getCurrentUserService();
  if (!isGlobalAdmin(current?.role)) {
    redirect("/admin");
  }

  return (
    <Card className="w-full">
      <CardContent>
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Productos</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona catálogo, precios, stock, imágenes y características específicas de cada producto.
          </p>
        </header>

        <hr className="border-border" />

        <Suspense
          fallback={
            <AdminProductsTable
              products={[]}
              brands={[]}
              brandTypes={[]}
              specificCharacteristics={[]}
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
