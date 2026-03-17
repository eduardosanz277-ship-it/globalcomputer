import { redirect } from "next/navigation";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { getAllUsersService } from "@/modules/admin/users/users.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminUsersTable } from "./AdminUsersTable";

export default async function AdminUsersPage() {
  const current = await getCurrentUserService();

  if (!current) {
    redirect("/auth/login");
  }

  if (current.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await getAllUsersService();

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Admin · Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de usuarios y roles (USER / ADMIN).
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminUsersTable users={users} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

