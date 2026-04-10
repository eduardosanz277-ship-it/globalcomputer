import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getAllCategoriesAdminService } from "@/modules/admin/categories/categories.service";
import { getAllSubcategoriesAdminService } from "@/modules/admin/subcategories/subcategories.service";
import { isGlobalAdmin } from "@/modules/auth/auth.guards";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { redirect } from "next/navigation";
import { AdminSubcategoriesTable } from "./AdminSubcategoriesTable";

async function AdminSubcategoriesTableSection() {
  const [categories, subcategories] = await Promise.all([
    getAllCategoriesAdminService(),
    getAllSubcategoriesAdminService(),
  ]);

  return (
    <AdminSubcategoriesTable categories={categories} subcategories={subcategories} />
  );
}

export default async function AdminSubcategoriesPage() {
  const current = await getCurrentUserService();
  if (!isGlobalAdmin(current?.role)) {
    redirect("/admin");
  }

  return (
    <Card className="w-full">
      <CardContent>
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">
            Subcategorías
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las subcategorías de cada categoría (por ejemplo, dentro
            de «Periféricos»: teclados, ratones). El estado activo permite
            ocultarlas al clasificar productos sin borrarlas.
          </p>
        </header>

        <hr className="border-border" />

        <Suspense
          fallback={
            <AdminSubcategoriesTable
              categories={[]}
              subcategories={[]}
              isLoading
            />
          }
        >
          <AdminSubcategoriesTableSection />
        </Suspense>
      </CardContent>
    </Card>
  );
}
