import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { AdminTableEmptyEmDash } from "@/components/admin/admin-table-empty";
import { isGlobalAdmin } from "@/modules/auth/auth.guards";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { listContactMessagesAdminService } from "@/modules/admin/contact-messages/contact-messages.service";
import type { ContactMessageAdmin } from "@/modules/admin/contact-messages/contact-messages.types";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";

function formatAdminContactsError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const m = (error as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return "No se pudieron cargar los mensajes.";
}

function truncateMessage(text: string, max = 96): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function MessageCell({ row }: { row: ContactMessageAdmin }) {
  return (
    <td
      className="max-w-[min(24rem,55vw)] align-top text-foreground"
      title={row.message}
    >
      <span className="line-clamp-3 break-words">
        {truncateMessage(row.message)}
      </span>
    </td>
  );
}

export default async function AdminContactsPage() {
  const current = await getCurrentUserService();
  if (!isGlobalAdmin(current?.role)) {
    redirect("/admin");
  }

  try {
    const messages = await listContactMessagesAdminService();

    return (
      <Card className="w-full">
        <CardContent className="space-y-4">
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

          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay mensajes registrados.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="whitespace-nowrap px-3 py-3 font-semibold text-foreground">
                      Nombre
                    </th>
                    <th className="whitespace-nowrap px-3 py-3 font-semibold text-foreground">
                      Email
                    </th>
                    <th className="whitespace-nowrap px-3 py-3 font-semibold text-foreground">
                      Teléfono
                    </th>
                    <th className="min-w-[8rem] whitespace-nowrap px-3 py-3 font-semibold text-foreground">
                      Asunto
                    </th>
                    <th className="min-w-[12rem] px-3 py-3 font-semibold text-foreground">
                      Mensaje
                    </th>
                    <th className="whitespace-nowrap px-3 py-3 font-semibold text-foreground">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-border/80 last:border-b-0 odd:bg-background even:bg-muted/20"
                    >
                      <td className="align-top px-3 py-3 font-medium text-foreground">
                        {row.name}
                      </td>
                      <td className="max-w-[14rem] break-all align-top px-3 py-3 text-foreground">
                        {row.email}
                      </td>
                      <td className="whitespace-nowrap align-top px-3 py-3 text-foreground">
                        {row.phone?.trim() ? (
                          row.phone
                        ) : (
                          <AdminTableEmptyEmDash />
                        )}
                      </td>
                      <td className="max-w-[14rem] align-top px-3 py-3 text-foreground">
                        <span className="line-clamp-2 break-words">
                          {row.subject}
                        </span>
                      </td>
                      <MessageCell row={row} />
                      <td className="whitespace-nowrap align-top px-3 py-3 text-muted-foreground">
                        {formatDateDdMmYyyyHhMm(row.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  } catch (error) {
    const message = formatAdminContactsError(error);
    return (
      <div className="w-full space-y-4 rounded-2xl border border-destructive/60 bg-destructive/10 p-6 text-sm text-destructive-foreground">
        <h1 className="text-xl font-semibold text-destructive">
          Mensajes de contacto
        </h1>
        <p>
          {message}. Comprueba tu sesión de administrador y que exista la tabla
          `contact_messages` en Supabase con `SUPABASE_SERVICE_ROLE_KEY`
          configurada.
        </p>
      </div>
    );
  }
}
