"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginSchema } from "@/modules/auth/auth.schema";
import { Form, FormField } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useServerAction } from "@/hooks/use-server-action";
import { loginAction } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
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
    onSuccess: () => router.push("/dashboard"),
  });

  const onSubmit = (values: LoginSchema) => {
    execute(values);
  };

  const errors = form.formState.errors;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <Form form={form} onSubmit={onSubmit}>
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
              {isPending ? "Entrando..." : "Entrar"}
            </Button>
          </Form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/auth/register" className="underline">
              Regístrate
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

