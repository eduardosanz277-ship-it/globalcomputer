import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getAllGeneralCharacteristicsService } from "@/modules/admin/general-characteristics/general-characteristics.service";
import { isGlobalAdmin } from "@/modules/auth/auth.guards";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { redirect } from "next/navigation";
import { AdminGeneralCharacteristicsTable } from "./AdminGeneralCharacteristicsTable";
import { GeneralCharacteristicsPageHeader } from "./GeneralCharacteristicsPageHeader";

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
        <GeneralCharacteristicsPageHeader />

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
