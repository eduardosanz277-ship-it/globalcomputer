import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getAllUsersService } from "@/modules/admin/users/users.service";
import { isGlobalAdmin } from "@/modules/auth/auth.guards";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { redirect } from "next/navigation";
import { AdminUsersTable } from "./AdminUsersTable";

async function AdminUsersTableSection() {
  const users = await getAllUsersService();
  return <AdminUsersTable users={users} />;
}

export default async function AdminUsersPage() {
  const current = await getCurrentUserService();
  if (!isGlobalAdmin(current?.role)) {
    redirect("/admin");
  }

  return (
    <Card className="w-full">
      <CardContent>
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Clientes y comercios con registro aprobado. Las solicitudes
            pendientes se gestionan en Suscripciones de Empresas.
          </p>
        </header>

        <hr className="border-border" />

        <Suspense fallback={<AdminUsersTable users={[]} isLoading />}>
          <AdminUsersTableSection />
        </Suspense>
      </CardContent>
    </Card>
  );
}
