import { redirect } from "next/navigation";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { canAccessAdminRoutes } from "@/modules/auth/auth.guards";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { ColumnDef } from "@tanstack/react-table";

type DemoItem = {
  id: number;
  name: string;
  status: string;
};

async function getDemoItems(): Promise<DemoItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("items")
    .select("id, name, status")
    .limit(20);

  if (error) {
    // En producción podrías loguear este error
    return [];
  }

  return (data ?? []) as DemoItem[];
}

const columns: ColumnDef<DemoItem>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Nombre" },
  { accessorKey: "status", header: "Estado" },
];

export default async function DashboardPage() {
  const user = await getCurrentUserService();

  if (!user) {
    redirect("/auth/login");
  }

  const items = await getDemoItems();

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Bienvenido, {user.fullName ?? user.email} ({user.role})
            </p>
          </div>
          <div className="flex items-center gap-3">
            {canAccessAdminRoutes(user.role) && (
              <Link href="/admin/users">
                <Button variant="outline">Panel admin</Button>
              </Link>
            )}
            <form action="/auth/logout" method="post">
              <Button type="submit" variant="outline">
                Cerrar sesión
              </Button>
            </form>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Ejemplo de tabla (TanStack Table)</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={items} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

