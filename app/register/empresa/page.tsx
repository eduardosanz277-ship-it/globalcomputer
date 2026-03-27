"use client";

import { registerBusinessAction } from "@/app/register/empresa/actions";
import { ButtonPending } from "@/components/ui/button-pending";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormField } from "@/components/ui/form";
import { useServerAction } from "@/hooks/use-server-action";
import {
  registerBusinessSchema,
  type RegisterBusinessFormInput,
} from "@/modules/auth/auth.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

export default function RegisterEmpresaPage() {
  const router = useRouter();
  const form = useForm<RegisterBusinessFormInput>({
    resolver: zodResolver(registerBusinessSchema),
    defaultValues: {
      businessName: "",
      phone: "",
      email: "",
      employerIdentificationNumber: "",
    },
  });

  const { execute, isPending } = useServerAction(registerBusinessAction, {
    successMessage:
      "Solicitud enviada. Un administrador debe aprobar tu cuenta; te notificaremos por correo cuando puedas iniciar sesión.",
    errorMessage: "No se pudo completar el registro",
    onSuccess: () => router.push("/login"),
  });

  const errors = form.formState.errors;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Registro como empresa</CardTitle>
          <CardDescription>
            Completa los datos de tu negocio. Su solicitud será revisada y se te notificará por correo cuando esté aprobada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form form={form} onSubmit={(v) => execute(v)}>
            <FormField
              name="businessName"
              label="Nombre de negocio"
              required
              autoComplete="organization"
              error={errors.businessName?.message}
            />
            <FormField
              name="phone"
              label="Teléfono"
              type="tel"
              autoComplete="tel"
              error={errors.phone?.message}
            />
            <FormField
              name="email"
              label="Correo electrónico"
              type="email"
              required
              autoComplete="email"
              error={errors.email?.message}
            />
            <FormField
              name="employerIdentificationNumber"
              label="Employer Identification Number (EIN)"
              required
              autoComplete="off"
              placeholder="p. ej. 12-3456789"
              error={errors.employerIdentificationNumber?.message}
            />
            <ButtonPending
              type="submit"
              className="w-full"
              pending={isPending}
              pendingLabel="Creando cuenta…"
              skipMinWidth
            >
              Crear cuenta de empresa
            </ButtonPending>
          </Form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="underline">
              Inicia sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
