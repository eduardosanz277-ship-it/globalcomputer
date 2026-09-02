import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getAllCategoriesAdminService } from "@/modules/admin/categories/categories.service";
import { isGlobalAdmin } from "@/modules/auth/auth.guards";
import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import { redirect } from "next/navigation";
import { AdminCategoriesTable } from "./AdminCategoriesTable";
import { CategoriesPageHeader } from "./CategoriesPageHeader";

async function AdminCategoriesTableSection() {
  const items = await getAllCategoriesAdminService();
  return <AdminCategoriesTable categories={items} />;
}

export default async function AdminCategoriesPage() {
  const current = await getCurrentUserStrictService();
  if (!isGlobalAdmin(current?.role)) {
    redirect("/admin");
  }

  return (
    <Card className="w-full">
      <CardContent>
        <CategoriesPageHeader />

        <hr className="border-border" />

        <Suspense fallback={<AdminCategoriesTable categories={[]} isLoading />}>
          <AdminCategoriesTableSection />
        </Suspense>
      </CardContent>
    </Card>
  );
}
