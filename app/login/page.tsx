"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Suspense, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useServerAction } from "@/hooks/use-server-action";
import {
  emailOtpCodeSchema,
  emailOtpRequestSchema,
  type EmailOtpCodeSchema,
  type EmailOtpRequestSchema,
} from "@/modules/auth/auth.schema";
import { sendLoginOtpAction, verifyLoginOtpAction } from "@/app/login/actions";

const loginErrorMessages: Record<string, string> = {
  admin:
    "Las cuentas de administrador deben iniciar sesión en Acceso admin.",
  auth:
    "No se pudo iniciar sesión. Solicita un nuevo enlace o código desde tu email.",
};

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginError = useMemo(() => {
    const code = searchParams.get("error");
    if (!code) return null;
    return loginErrorMessages[code] ?? loginErrorMessages.auth;
  }, [searchParams]);

  const [step, setStep] = useState<"email" | "code">("email");
  const [emailForCode, setEmailForCode] = useState("");

  const emailForm = useForm<EmailOtpRequestSchema>({
    resolver: zodResolver(emailOtpRequestSchema),
    defaultValues: { email: "" },
  });

  const codeForm = useForm<EmailOtpCodeSchema>({
    resolver: zodResolver(emailOtpCodeSchema),
    defaultValues: { code: "" },
  });

  const { execute: sendOtp, isPending: sending } = useServerAction(
    sendLoginOtpAction,
    {
      successMessage:
        "Revisa tu correo: abre el enlace para entrar o usa el código de verificación.",
      onSuccess: () => {
        const e = emailForm.getValues("email").trim().toLowerCase();
        setEmailForCode(e);
        codeForm.reset({ code: "" });
        setStep("code");
      },
    }
  );

  const { execute: verifyOtp, isPending: verifying } = useServerAction(
    verifyLoginOtpAction,
    {
      successMessage: "Sesión iniciada",
      onSuccess: () => {
        router.push("/");
        router.refresh();
      },
    }
  );

  const emailErrors = emailForm.formState.errors;
  const codeErrors = codeForm.formState.errors;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>
            Clientes y empresas: te enviamos un enlace mágico y, si lo
            prefieres, un código. Los administradores deben usar{" "}
            <Link href="/admin/login" className="font-medium underline">
              Acceso admin
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loginError && (
            <p
              className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {loginError}
            </p>
          )}
          {step === "email" ? (
            <Form
              form={emailForm}
              onSubmit={(v) => sendOtp(v.email)}
            >
              <FormField
                name="email"
                label="Email"
                type="email"
                autoComplete="email"
                required
                error={emailErrors.email?.message}
              />
              <Button type="submit" className="mt-4 w-full" disabled={sending}>
                {sending ? "Enviando..." : "Enviar enlace y código"}
              </Button>
            </Form>
          ) : (
            <>
              <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Código enviado a </span>
                <span className="font-medium">{emailForCode}</span>
                <button
                  type="button"
                  className="ml-2 text-xs text-primary underline"
                    onClick={() => {
                    setStep("email");
                    codeForm.reset({ code: "" });
                  }}
                >
                  Cambiar email
                </button>
              </div>
              <Form
                form={codeForm}
                onSubmit={(v) => verifyOtp(emailForCode, v.code)}
              >
                <div className="space-y-2">
                  <Label htmlFor="otp-code">Código</Label>
                  <Input
                    id="otp-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    maxLength={10}
                    aria-invalid={Boolean(codeErrors.code)}
                    {...codeForm.register("code")}
                  />
                  {codeErrors.code && (
                    <p className="text-sm text-destructive">{codeErrors.code.message}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="mt-4 w-full"
                  disabled={verifying}
                >
                  {verifying ? "Verificando..." : "Entrar"}
                </Button>
              </Form>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="underline">
              Regístrate
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center px-4">
          <p className="text-sm text-muted-foreground">Cargando…</p>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
