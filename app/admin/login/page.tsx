"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField } from "@/components/ui/form";
import { loginAction } from "@/app/login/actions";
import { useServerAction } from "@/hooks/use-server-action";
import { loginSchema, type LoginSchema } from "@/modules/auth/auth.schema";

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
    onSuccess: () => {
      router.push("/admin/users");
      router.refresh();
    },
  });

  const onSubmit = (values: LoginSchema) => execute(values);

  const errors = form.formState.errors;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Acceso admin</CardTitle>
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
              {isPending ? "Entrando..." : "Entrar al panel"}
            </Button>
          </Form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿Necesitas cuenta?{" "}
            <Link href="/register" className="underline">
              Regístrate
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

