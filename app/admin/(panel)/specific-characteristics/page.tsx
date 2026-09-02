import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getAllGeneralCharacteristicsService } from "@/modules/admin/general-characteristics/general-characteristics.service";
import { getAllSpecificCharacteristicsService } from "@/modules/admin/specific-characteristics/specific-characteristics.service";
import { isGlobalAdmin } from "@/modules/auth/auth.guards";
import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import { redirect } from "next/navigation";
import { AdminSpecificCharacteristicsTable } from "./AdminSpecificCharacteristicsTable";
import { SpecificCharacteristicsPageHeader } from "./SpecificCharacteristicsPageHeader";

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
  const current = await getCurrentUserStrictService();
  if (!isGlobalAdmin(current?.role)) {
    redirect("/admin");
  }

  return (
    <Card className="w-full">
      <CardContent>
        <SpecificCharacteristicsPageHeader />

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
