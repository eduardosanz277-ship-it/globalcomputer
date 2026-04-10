import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getAllCategoriesAdminService } from "@/modules/admin/categories/categories.service";
import { isGlobalAdmin } from "@/modules/auth/auth.guards";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { redirect } from "next/navigation";
import { AdminCategoriesTable } from "./AdminCategoriesTable";

async function AdminCategoriesTableSection() {
  const items = await getAllCategoriesAdminService();
  return <AdminCategoriesTable categories={items} />;
}

export default async function AdminCategoriesPage() {
  const current = await getCurrentUserService();
  if (!isGlobalAdmin(current?.role)) {
    redirect("/admin");
  }

  return (
    <Card className="w-full">
      <CardContent>
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">
            Categorías
          </h1>
          <p className="text-sm text-muted-foreground">
            Define categorías de producto reutilizables. Las subcategorías se
            asocian a cada categoría al clasificar productos. El estado activo
            permite ocultarlas en la tienda y en la asignación de productos sin
            perder el historial.
          </p>
        </header>

        <hr className="border-border" />

        <Suspense
          fallback={
            <AdminCategoriesTable categories={[]} isLoading />
          }
        >
          <AdminCategoriesTableSection />
        </Suspense>
      </CardContent>
    </Card>
  );
}
