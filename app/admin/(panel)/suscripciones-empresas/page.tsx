import { Card, CardContent } from "@/components/ui/card";
import { listBusinessProfilesService } from "@/modules/admin/business-profiles/business-profiles.service";
import { isGlobalAdmin } from "@/modules/auth/auth.guards";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminSuscripcionesEmpresasTable } from "./AdminSuscripcionesEmpresasTable";

async function TableSection() {
  const rows = await listBusinessProfilesService();
  return <AdminSuscripcionesEmpresasTable rows={rows} />;
}

export default async function AdminSuscripcionesEmpresasPage() {
  const current = await getCurrentUserService();
  if (!isGlobalAdmin(current?.role)) {
    redirect("/admin");
  }

  return (
    <Card className="w-full">
      <CardContent>
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">
            Suscripciones de Empresas
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona el alta de los perfiles de empresa.
          </p>
        </header>

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
