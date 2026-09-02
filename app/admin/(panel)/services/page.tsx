import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getAllServicesService } from "@/modules/admin/services/services.service";
import { isGlobalAdmin } from "@/modules/auth/auth.guards";
import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import { redirect } from "next/navigation";
import { AdminServicesTable } from "./AdminServicesTable";
import { ServicesPageHeader } from "./ServicesPageHeader";

async function AdminServicesTableSection() {
  const services = await getAllServicesService();
  return <AdminServicesTable services={services} />;
}

export default async function AdminServicesPage() {
  const current = await getCurrentUserStrictService();
  if (!isGlobalAdmin(current?.role)) {
    redirect("/admin");
  }

  return (
    <Card className="w-full">
      <CardContent>
        <ServicesPageHeader />

        <hr className="border-border" />

        <Suspense fallback={<AdminServicesTable services={[]} isLoading />}>
          <AdminServicesTableSection />
        </Suspense>
      </CardContent>
    </Card>
  );
}
