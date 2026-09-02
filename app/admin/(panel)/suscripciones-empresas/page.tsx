import { Card, CardContent } from "@/components/ui/card";
import { listBusinessProfilesService } from "@/modules/admin/business-profiles/business-profiles.service";
import { isGlobalAdmin } from "@/modules/auth/auth.guards";
import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminSuscripcionesEmpresasTable } from "./AdminSuscripcionesEmpresasTable";
import { SuscripcionesEmpresasPageHeader } from "./SuscripcionesEmpresasPageHeader";

async function TableSection() {
  const rows = await listBusinessProfilesService();
  return <AdminSuscripcionesEmpresasTable rows={rows} />;
}

export default async function AdminSuscripcionesEmpresasPage() {
  const current = await getCurrentUserStrictService();
  if (!isGlobalAdmin(current?.role)) {
    redirect("/admin");
  }

  return (
    <Card className="w-full">
      <CardContent>
        <SuscripcionesEmpresasPageHeader />

        <hr className="border-border" />

        <Suspense
          fallback={<AdminSuscripcionesEmpresasTable rows={[]} isLoading />}
        >
          <TableSection />
        </Suspense>
      </CardContent>
    </Card>
  );
}
