import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getAllServicesService } from "@/modules/admin/services/services.service";
import { isGlobalAdmin } from "@/modules/auth/auth.guards";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { redirect } from "next/navigation";
import { AdminServicesTable } from "./AdminServicesTable";

async function AdminServicesTableSection() {
  const services = await getAllServicesService();
  return <AdminServicesTable services={services} />;
}

export default async function AdminServicesPage() {
  const current = await getCurrentUserService();
  if (!isGlobalAdmin(current?.role)) {
    redirect("/admin");
  }

  return (
    <Card className="w-full">
      <CardContent>
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Servicios</h1>
          <p className="text-sm text-muted-foreground">
            Crea, edita o elimina servicios. Puedes definir nombre y descripción
            para mostrarlos en el catálogo.
          </p>
        </header>

        <hr className="border-border" />

        <Suspense fallback={<AdminServicesTable services={[]} isLoading />}>
          <AdminServicesTableSection />
        </Suspense>
      </CardContent>
    </Card>
  );
}
