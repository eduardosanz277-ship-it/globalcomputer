import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getAllBrandTypesService } from "@/modules/admin/brand-types/brand-types.service";
import { getAllBrandsService } from "@/modules/admin/brands/brands.service";
import { isGlobalAdmin } from "@/modules/auth/auth.guards";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { redirect } from "next/navigation";
import { AdminBrandTypesTable } from "./AdminBrandTypesTable";

async function AdminBrandTypesTableSection() {
  const [brands, brandTypes] = await Promise.all([
    getAllBrandsService(),
    getAllBrandTypesService(),
  ]);
  return <AdminBrandTypesTable brands={brands} brandTypes={brandTypes} />;
}

export default async function AdminBrandTypesPage() {
  const current = await getCurrentUserService();
  if (!isGlobalAdmin(current?.role)) {
    redirect("/admin");
  }

  return (
    <Card className="w-full">
      <CardContent>
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">
            Tipos por marca
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los tipos de producto asociados a cada marca (por ejemplo
            zapatillas, ropa). El estado activo permite ocultarlos del catálogo
            sin borrarlos.
          </p>
        </header>

        <hr className="border-border" />

        <Suspense
          fallback={
            <AdminBrandTypesTable brands={[]} brandTypes={[]} isLoading />
          }
        >
          <AdminBrandTypesTableSection />
        </Suspense>
      </CardContent>
    </Card>
  );
}
