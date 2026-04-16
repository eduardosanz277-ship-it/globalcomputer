"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import {
  AuthAlert,
  AuthBrandHeader,
  AuthCard,
  AuthField,
  AuthFooterLinks,
  AuthHeading,
  AuthInlineLinkRow,
  AuthInput,
  AuthLayout,
  AuthPrimaryButton,
} from "@/components/auth";
import { Form } from "@/components/ui/form";
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
    "Las cuentas de administrador deben iniciar sesión en Acceso administrativo.",
  auth: "No se pudo iniciar sesión. Solicita un nuevo enlace o código desde tu email.",
  pending_business:
    "Tu cuenta de empresa está pendiente de aprobación. Te avisaremos por correo cuando puedas entrar.",
  rejected_business:
    "Tu solicitud de empresa no fue aprobada. Contacta con soporte si necesitas más información.",
};

const OTP_COOLDOWN_SECONDS = 60;
const OTP_COOLDOWN_MS = OTP_COOLDOWN_SECONDS * 1000;

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
  const [blockedUntil, setBlockedUntil] = useState<Date | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isFetchingCooldown, setIsFetchingCooldown] = useState(false);

  const emailForm = useForm<EmailOtpRequestSchema>({
    resolver: zodResolver(emailOtpRequestSchema),
    defaultValues: { email: "" },
  });

  const codeForm = useForm<EmailOtpCodeSchema>({
    resolver: zodResolver(emailOtpCodeSchema),
    defaultValues: { code: "" },
  });

  const watchedEmail = emailForm.watch("email") ?? "";
  const normalizedEmail = useMemo(
    () => watchedEmail.trim().toLowerCase(),
    [watchedEmail],
  );

  const fetchCooldown = useCallback(async (email: string) => {
    if (!email) {
      setBlockedUntil(null);
      return;
    }
    setIsFetchingCooldown(true);
    try {
      const res = await fetch(`/api/otp/cooldown?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        setBlockedUntil(null);
        return;
      }
      const data: { blockedUntil: string | null } = await res.json();
      setBlockedUntil(data.blockedUntil ? new Date(data.blockedUntil) : null);
    } catch (error) {
      console.error("fetchCooldown:", error);
      setBlockedUntil(null);
    } finally {
      setIsFetchingCooldown(false);
    }
  }, []);

  const { execute: sendOtp, isPending: sending } = useServerAction(
    async (email: string) => {
      const res = await sendLoginOtpAction(email);
      if (!res.ok) throw new Error(res.message);
      return res;
    },
    {
      successMessage:
        "Revisa tu correo: abre el enlace para entrar o usa el código de verificación.",
      onSuccess: () => {
        const e = emailForm.getValues("email").trim().toLowerCase();
        setEmailForCode(e);
        codeForm.reset({ code: "" });
        setStep("code");
        setBlockedUntil(new Date(Date.now() + OTP_COOLDOWN_MS));
      },
    },
  );

  const handleGoToVerify = useCallback(() => {
    if (!normalizedEmail) return;
    setEmailForCode(normalizedEmail);
    setStep("code");
  }, [normalizedEmail]);

  const handleEmailSubmit = async (values: EmailOtpRequestSchema) => {
    const email = values.email.trim().toLowerCase();
    if (blockedUntil && blockedUntil.getTime() > Date.now()) {
      setEmailForCode(email);
      setStep("code");
      return;
    }
    await sendOtp(email);
  };

  useEffect(() => {
    if (!normalizedEmail) {
      setBlockedUntil(null);
      return;
    }
    const timer = setTimeout(() => {
      fetchCooldown(normalizedEmail);
    }, 500);
    return () => clearTimeout(timer);
  }, [normalizedEmail, fetchCooldown]);

  useEffect(() => {
    if (!blockedUntil) {
      setCooldownSeconds(0);
      return;
    }
    const update = () => {
      const remainingMs = blockedUntil.getTime() - Date.now();
      if (remainingMs <= 0) {
        setBlockedUntil(null);
        setCooldownSeconds(0);
        return;
      }
      setCooldownSeconds(Math.ceil(remainingMs / 1000));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [blockedUntil]);

  const { execute: verifyOtp, isPending: verifying } = useServerAction(
    verifyLoginOtpAction,
    {
      successMessage: "Sesión iniciada",
      onSuccess: () => {
        router.push("/");
        router.refresh();
      },
    },
  );

  const emailErrors = emailForm.formState.errors;
  const codeErrors = codeForm.formState.errors;
  const isCooldownActive = Boolean(blockedUntil && cooldownSeconds > 0);

  return (
    <AuthLayout>
      <AuthBrandHeader />
      <AuthCard>
        <AuthHeading
          title="Iniciar sesión"
          description="Accede con tu correo electrónico."
        />

        {loginError ? <AuthAlert>{loginError}</AuthAlert> : null}

        {step === "email" ? (
          <Form
            form={emailForm}
            onSubmit={(v) => sendOtp(v.email)}
            className="space-y-4"
          >
            <AuthField
              name="email"
              label="Correo electrónico"
              type="email"
              autoComplete="email"
              required
              error={emailErrors.email?.message}
            />
            <AuthPrimaryButton
              type="submit"
              pending={sending}
              pendingLabel="Enviando"
              disabled={sending || cooldown > 0}
            >
              Continuar{cooldownLabel}
            </AuthPrimaryButton>
          </Form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
              <span className="text-muted-foreground">Código enviado a </span>
              <span className="font-medium text-foreground">
                {emailForCode}
              </span>
            </div>
            <Form
              form={codeForm}
              onSubmit={(v) => verifyOtp(emailForCode, v.code)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="otp-code">Código de verificación</Label>
                <AuthInput
                  id="otp-code"
                  inputMode="text"
                  autoComplete="one-time-code"
                  placeholder="123456 o token largo"
                  maxLength={128}
                  required
                  aria-invalid={Boolean(codeErrors.code)}
                  {...codeForm.register("code")}
                />
                {codeErrors.code ? (
                  <p className="text-sm text-destructive" role="alert">
                    {codeErrors.code.message}
                  </p>
                ) : null}
              </div>
              <AuthPrimaryButton
                type="submit"
                pending={verifying}
                pendingLabel="Verificando…"
              >
                Entrar
              </AuthPrimaryButton>
              <div className="text-center text-sm leading-relaxed text-muted-foreground">
                <AuthInlineLinkRow>
                  <span>¿No es tu correo?</span>
                  <button
                    type="button"
                    className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
                    onClick={() => {
                      setStep("email");
                      codeForm.reset({ code: "" });
                    }}
                  >
                    Cambiar correo
                  </button>
                </AuthInlineLinkRow>
              </div>
            </Form>
          </div>
        )}

        {step === "email" ? (
          <AuthFooterLinks>
            <AuthInlineLinkRow>
              <span>¿Eres empresa?</span>
              <Link
                href="/register/empresa"
                className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
              >
                Crear cuenta empresarial
              </Link>
            </AuthInlineLinkRow>
            <AuthInlineLinkRow>
              <span>¿Administrador?</span>
              <Link
                href="/admin/login"
                className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
              >
                Acceso administrativo
              </Link>
            </AuthInlineLinkRow>
          </AuthFooterLinks>
        ) : null}
      </AuthCard>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout>
          <AuthBrandHeader />
          <AuthCard>
            <p className="text-center text-sm text-muted-foreground">
              Cargando…
            </p>
          </AuthCard>
        </AuthLayout>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
