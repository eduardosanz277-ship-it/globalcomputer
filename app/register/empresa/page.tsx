"use client";

import { registerBusinessAction } from "@/app/register/empresa/actions";
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
    <AuthLayout>
      <AuthBrandHeader />
      <AuthCard>
        <AuthHeading
          title="Crear cuenta de empresa"
          description="Completa los datos de tu negocio."
        />

        <Form form={form} onSubmit={(v) => execute(v)} className="space-y-5">
          <AuthField
            name="businessName"
            label="Nombre del negocio"
            required
            autoComplete="organization"
            error={errors.businessName?.message}
          />
          <AuthField
            name="phone"
            label="Teléfono"
            type="tel"
            autoComplete="tel"
            error={errors.phone?.message}
          />
          <AuthField
            name="email"
            label="Correo electrónico"
            type="email"
            required
            autoComplete="email"
            error={errors.email?.message}
          />
          <AuthField
            name="employerIdentificationNumber"
            label="Employer Identification Number (EIN)"
            required
            autoComplete="off"
            placeholder="p. ej. 12-3456789"
            error={errors.employerIdentificationNumber?.message}
          />
          <AuthPrimaryButton
            type="submit"
            pending={isPending}
            pendingLabel="Enviando solicitud…"
          >
            Enviar solicitud
          </AuthPrimaryButton>
        </Form>

        <AuthFooterLinks>
          <AuthInlineLinkRow>
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
            >
              Inicia sesión
            </Link>
          </AuthInlineLinkRow>
        </AuthFooterLinks>
      </AuthCard>
    </AuthLayout>
  );
}
