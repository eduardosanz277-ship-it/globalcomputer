import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { isGlobalAdmin } from "@/modules/auth/auth.guards";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { listContactMessagesAdminService } from "@/modules/admin/contact-messages/contact-messages.service";
import { AdminContactsTable } from "./AdminContactsTable";

function formatAdminContactsError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const m = (error as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return "No se pudieron cargar los mensajes.";
}

async function AdminContactsTableSection() {
  try {
    const messages = await listContactMessagesAdminService();
    return <AdminContactsTable messages={messages} />;
  } catch (error) {
    const message = formatAdminContactsError(error);
    return (
      <div className="w-full space-y-4 rounded-2xl border border-destructive/60 bg-destructive/10 p-6 text-sm text-destructive-foreground">
        <h2 className="text-xl font-semibold text-destructive">
          Mensajes de contacto
        </h2>
        <p>
          {message}. Comprueba tu sesión de administrador y que exista la tabla
          `contact_messages` en Supabase con `SUPABASE_SERVICE_ROLE_KEY`
          configurada.
        </p>
      </div>
    );
  }
}

export default async function AdminContactsPage() {
  const current = await getCurrentUserService();
  if (!isGlobalAdmin(current?.role)) {
    redirect("/admin");
  }

  return (
    <Card className="w-full">
      <CardContent>
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">
            Mensajes de contacto
          </h1>
          <p className="text-sm text-muted-foreground">
            Consulta los mensajes enviados desde el formulario público de
            contacto.
          </p>
        </header>

        <hr className="border-border" />

        <Suspense fallback={<AdminContactsTable messages={[]} isLoading />}>
          <AdminContactsTableSection />
        </Suspense>
      </CardContent>
    </Card>
  );
}
