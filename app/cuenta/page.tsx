import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getCurrentUserService } from "@/modules/auth/auth.service";

export const metadata: Metadata = {
  title: "Mi cuenta",
  description: "Datos de tu perfil y sesión.",
};

function roleLabel(role: string): string {
  if (role === "ADMIN") return "Administrador";
  if (role === "BUSINESS") return "Empresa";
  return "Cliente";
}

export default async function CuentaPage() {
  const user = await getCurrentUserService();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, role, created_at, updated_at, phone, employer_identification_number",
    )
    .eq("id", user.id)
    .maybeSingle();

  const fmt = (iso: string | null | undefined) => {
    if (!iso) return "—";
    try {
      return new Intl.DateTimeFormat("es", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={user} />

      <main className="flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Mi cuenta
              </h1>
              <p className="text-sm text-muted-foreground">
                Datos de tu perfil en Global Computers USA
              </p>
            </div>
            <form action="/auth/logout" method="post" className="shrink-0">
              <Button type="submit" variant="outline">
                Cerrar sesión
              </Button>
            </form>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>
                Información asociada a tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <dl className="grid gap-3 sm:grid-cols-[140px_1fr] sm:gap-x-4">
                <dt className="text-muted-foreground">
                  {(profile?.role ?? user.role) === "BUSINESS"
                    ? "Nombre de negocio"
                    : "Nombre"}
                </dt>
                <dd className="font-medium">
                  {profile?.full_name?.trim() || user.fullName?.trim() || "—"}
                </dd>

                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium">{user.email}</dd>

                <dt className="text-muted-foreground">Tipo de cuenta</dt>
                <dd className="font-medium">
                  {roleLabel(profile?.role ?? user.role)}
                </dd>

                {(profile?.role ?? user.role) === "BUSINESS" && (
                  <>
                    <dt className="text-muted-foreground">Teléfono</dt>
                    <dd className="font-medium">
                      {profile?.phone?.trim() || "—"}
                    </dd>
                    <dt className="text-muted-foreground">
                      Employer Identification Number (EIN)
                    </dt>
                    <dd className="font-mono text-sm font-medium">
                      {profile?.employer_identification_number?.trim() || "—"}
                    </dd>
                  </>
                )}

                <dt className="text-muted-foreground">Alta</dt>
                <dd>{fmt(profile?.created_at)}</dd>

                <dt className="text-muted-foreground">Última actualización</dt>
                <dd>{fmt(profile?.updated_at)}</dd>
              </dl>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/" className="underline">
              Volver al inicio
            </Link>
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
