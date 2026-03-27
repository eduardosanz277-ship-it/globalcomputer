"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerSchema,
  type RegisterSchema,
} from "@/modules/auth/auth.schema";
import { Form, FormField } from "@/components/ui/form";
import { ButtonPending } from "@/components/ui/button-pending";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useServerAction } from "@/hooks/use-server-action";
import { registerAction } from "@/app/register/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
    },
  });

  const { execute, isPending } = useServerAction(registerAction, {
    successMessage: "Registro completado",
    errorMessage: "No se pudo registrar",
    onSuccess: () => router.push("/"),
  });

  const errors = form.formState.errors;

  const onSubmit = (values: RegisterSchema) => {
    execute(values);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Registro</CardTitle>
        </CardHeader>
        <CardContent>
          <Form form={form} onSubmit={onSubmit}>
            <FormField
              name="fullName"
              label="Nombre completo"
              required
              error={errors.fullName?.message}
            />
            <FormField
              name="email"
              label="Email"
              type="email"
              required
              error={errors.email?.message}
            />
            <FormField
              name="password"
              label="Contraseña"
              type="password"
              required
              error={errors.password?.message}
            />
            <ButtonPending
              type="submit"
              className="w-full"
              pending={isPending}
              pendingLabel="Creando cuenta…"
              skipMinWidth
            >
              Crear cuenta
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
