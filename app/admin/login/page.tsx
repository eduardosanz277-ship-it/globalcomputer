"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField } from "@/components/ui/form";
import { loginAction } from "@/app/auth/login/actions";
import { loginSchema, type LoginSchema } from "@/modules/auth/auth.schema";
import { useServerAction } from "@/hooks/use-server-action";

export default function AdminLoginPage() {
  const router = useRouter();

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { execute, isPending } = useServerAction(loginAction, {
    successMessage: "Sesión iniciada",
    errorMessage: "No se pudo iniciar sesión",
    onSuccess: () => router.push("/admin/users"),
  });

  const errors = form.formState.errors;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Acceso admin</CardTitle>
        </CardHeader>
        <CardContent>
          <Form form={form} onSubmit={(values) => execute(values)}>
            <FormField
              name="email"
              label="Email"
              type="email"
              error={errors.email?.message}
            />
            <FormField
              name="password"
              label="Contraseña"
              type="password"
              error={errors.password?.message}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Entrando..." : "Entrar al panel"}
            </Button>
          </Form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿Necesitas cuenta?{" "}
            <Link href="/auth/register" className="underline">
              Regístrate
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

