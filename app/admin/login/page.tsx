"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  AuthBrandHeader,
  AuthCard,
  AuthField,
  AuthFooterLinks,
  AuthHeading,
  AuthInlineLinkRow,
  AuthLayout,
  AuthPrimaryButton,
} from "@/components/auth";
import { Form } from "@/components/ui/form";
import { adminLoginAction } from "@/app/admin/login/actions";
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

  const { execute, isPending } = useServerAction(adminLoginAction, {
    successMessage: "Sesión iniciada",
    onSuccess: () => {
      router.push("/admin/home");
      router.refresh();
    },
  });

  const onSubmit = (values: LoginSchema) => execute(values);

  const errors = form.formState.errors;

  return (
    <AuthLayout>
      <AuthBrandHeader />
      <AuthCard>
        <AuthHeading
          title="Acceso administrativo"
          description="Usa el correo y la contraseña de tu cuenta de administrador."
        />

        <Form form={form} onSubmit={onSubmit} className="space-y-4">
          <AuthField
            name="email"
            label="Correo electrónico"
            type="email"
            required
            error={errors.email?.message}
          />
          <AuthField
            name="password"
            label="Contraseña"
            type="password"
            required
            error={errors.password?.message}
          />
          <AuthPrimaryButton
            type="submit"
            pending={isPending}
            pendingLabel="Entrando"
          >
            Entrar al panel
          </AuthPrimaryButton>
        </Form>

        <AuthFooterLinks>
          <AuthInlineLinkRow>
            <span>¿Eres cliente o empresa?</span>
            <Link
              href="/login"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
            >
              Iniciar sesión
            </Link>
          </AuthInlineLinkRow>
        </AuthFooterLinks>
      </AuthCard>
    </AuthLayout>
  );
}
