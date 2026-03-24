import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getAllGeneralCharacteristicsService } from "@/modules/admin/general-characteristics/general-characteristics.service";
import { getAllSpecificCharacteristicsService } from "@/modules/admin/specific-characteristics/specific-characteristics.service";
import { isGlobalAdmin } from "@/modules/auth/auth.guards";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { redirect } from "next/navigation";
import { AdminSpecificCharacteristicsTable } from "./AdminSpecificCharacteristicsTable";

async function AdminSpecificCharacteristicsTableSection() {
  const [generalCharacteristics, specificCharacteristics] = await Promise.all([
    getAllGeneralCharacteristicsService(),
    getAllSpecificCharacteristicsService(),
  ]);

  return (
    <AdminSpecificCharacteristicsTable
      generalCharacteristics={generalCharacteristics}
      specificCharacteristics={specificCharacteristics}
    />
  );
}

export default async function AdminSpecificCharacteristicsPage() {
  const current = await getCurrentUserService();
  if (!isGlobalAdmin(current?.role)) {
    redirect("/admin");
  }

  return (
    <Card className="w-full">
      <CardContent>
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">
            Características específicas
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los valores de cada característica general (por ejemplo,
            Color - Rojo/Negro, RAM - 8GB/16GB). El estado activo permite
            ocultarlas sin borrarlas.
          </p>
        </header>

        <hr className="border-border" />

        <Suspense
          fallback={
            <AdminSpecificCharacteristicsTable
              generalCharacteristics={[]}
              specificCharacteristics={[]}
              isLoading
            />
          }
        >
          <AdminSpecificCharacteristicsTableSection />
        </Suspense>
      </CardContent>
    </Card>
  );
}
