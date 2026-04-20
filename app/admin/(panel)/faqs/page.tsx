import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getAllFaqsAdminService } from "@/modules/admin/faqs/faqs.service";
import { isGlobalAdmin } from "@/modules/auth/auth.guards";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { redirect } from "next/navigation";
import { AdminFaqsTable } from "./AdminFaqsTable";

async function AdminFaqsTableSection() {
  const items = await getAllFaqsAdminService();
  return <AdminFaqsTable faqs={items} />;
}

export default async function AdminFaqsPage() {
  const current = await getCurrentUserService();
  if (!isGlobalAdmin(current?.role)) {
    redirect("/admin");
  }

  return (
    <Card className="w-full">
      <CardContent>
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">
            Preguntas frecuentes
          </h1>
          <p className="text-sm text-muted-foreground">
            Crea y administra las preguntas frecuentes mostradas en el home. Al
            desactivarlas, dejan de mostrarse sin perder el contenido.
          </p>
        </header>

        <hr className="border-border" />

        <Suspense fallback={<AdminFaqsTable faqs={[]} isLoading />}>
          <AdminFaqsTableSection />
        </Suspense>
      </CardContent>
    </Card>
  );
}
