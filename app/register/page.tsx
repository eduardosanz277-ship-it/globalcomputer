"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerSchema,
  type RegisterSchema,
} from "@/modules/auth/auth.schema";
import { Form } from "@/components/ui/form";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useServerAction } from "@/hooks/use-server-action";
import { registerAction } from "@/app/register/actions";
import { useI18n } from "@/components/i18n/I18nProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { locale } = useI18n();
  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
    },
  });

  const { execute, isPending } = useServerAction(
    async (values: RegisterSchema) => {
      const res = await registerAction(values, locale);
      if (!res.ok) throw new Error(res.message);
      return res;
    },
    {
      successMessage: "Registro completado",
      errorMessage: "No se pudo registrar",
      onSuccess: () => router.push("/"),
    },
  );

  const errors = form.formState.errors;

  const onSubmit = (values: RegisterSchema) => {
    execute(values);
  };

  return (
    <AuthLayout>
      <AuthBrandHeader />
      <AuthCard>
        <AuthHeading
          title="Crear cuenta"
          description="Introduce tus datos para registrarte."
        />

        <Form form={form} onSubmit={onSubmit} className="space-y-4">
          <AuthField
            name="fullName"
            label="Nombre completo"
            required
            error={errors.fullName?.message}
          />
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
            pendingLabel="Creando cuenta…"
          >
            Crear cuenta
          </AuthPrimaryButton>
        </Form>

        <AuthFooterLinks>
          <AuthInlineLinkRow>
            <span>¿Ya tienes cuenta?</span>
            <Link
              href="/login"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
            >
              Inicia sesión
            </Link>
          </AuthInlineLinkRow>
          <AuthInlineLinkRow>
            <span>¿Eres empresa?</span>
            <Link
              href="/register/empresa"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
            >
              Crear cuenta empresarial
            </Link>
          </AuthInlineLinkRow>
        </AuthFooterLinks>
      </AuthCard>
    </AuthLayout>
  );
}
