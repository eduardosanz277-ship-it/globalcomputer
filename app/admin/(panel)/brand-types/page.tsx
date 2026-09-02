import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getAllBrandTypesService } from "@/modules/admin/brand-types/brand-types.service";
import { getAllBrandsService } from "@/modules/admin/brands/brands.service";
import { isGlobalAdmin } from "@/modules/auth/auth.guards";
import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import { redirect } from "next/navigation";
import { AdminBrandTypesTable } from "./AdminBrandTypesTable";
import { BrandTypesPageHeader } from "./BrandTypesPageHeader";

async function AdminBrandTypesTableSection() {
  const [brands, brandTypes] = await Promise.all([
    getAllBrandsService(),
    getAllBrandTypesService(),
  ]);
  return <AdminBrandTypesTable brands={brands} brandTypes={brandTypes} />;
}

export default async function AdminBrandTypesPage() {
  const current = await getCurrentUserStrictService();
  if (!isGlobalAdmin(current?.role)) {
    redirect("/admin");
  }

  return (
    <Card className="w-full">
      <CardContent>
        <BrandTypesPageHeader />

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
