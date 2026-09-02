import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getAllBrandsService } from "@/modules/admin/brands/brands.service";
import { isGlobalAdmin } from "@/modules/auth/auth.guards";
import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import { redirect } from "next/navigation";
import { AdminBrandsTable } from "./AdminBrandsTable";
import { BrandsPageHeader } from "./BrandsPageHeader";

async function AdminBrandsTableSection() {
  const brands = await getAllBrandsService();
  return <AdminBrandsTable brands={brands} />;
}

export default async function AdminBrandsPage() {
  const current = await getCurrentUserStrictService();
  if (!isGlobalAdmin(current?.role)) {
    redirect("/admin");
  }

  return (
    <Card className="w-full">
      <CardContent>
        <BrandsPageHeader />

        <hr className="border-border" />

        <Suspense fallback={<AdminBrandsTable brands={[]} isLoading />}>
          <AdminBrandsTableSection />
        </Suspense>
      </CardContent>
    </Card>
  );
}
