import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getAllGeneralCharacteristicsService } from "@/modules/admin/general-characteristics/general-characteristics.service";
import { isGlobalAdmin } from "@/modules/auth/auth.guards";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { redirect } from "next/navigation";
import { AdminGeneralCharacteristicsTable } from "./AdminGeneralCharacteristicsTable";

async function AdminGeneralCharacteristicsTableSection() {
  const items = await getAllGeneralCharacteristicsService();
  return <AdminGeneralCharacteristicsTable characteristics={items} />;
}

export default async function AdminGeneralCharacteristicsPage() {
  const current = await getCurrentUserService();
  if (!isGlobalAdmin(current?.role)) {
    redirect("/admin");
  }

  return (
    <Card className="w-full">
      <CardContent>
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">
            Características generales
          </h1>
          <p className="text-sm text-muted-foreground">
            Define dimensiones de producto reutilizables (por ejemplo Color,
            Memoria RAM). Los valores concretos se gestionan como
            características específicas. El estado activo permite ocultarlas al
            configurar productos sin borrarlas.
          </p>
        </header>

        <hr className="border-border" />

        <Suspense
          fallback={
            <AdminGeneralCharacteristicsTable characteristics={[]} isLoading />
          }
        >
          <AdminGeneralCharacteristicsTableSection />
        </Suspense>
      </CardContent>
    </Card>
  );
}
