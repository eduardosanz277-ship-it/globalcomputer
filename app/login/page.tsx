"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { sendLoginOtpAction, verifyLoginOtpAction } from "@/app/login/actions";
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
import { useI18n } from "@/components/i18n/I18nProvider";
import { LANGUAGE_LABEL_KEY, type Locale } from "@/components/i18n/translations";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { useServerAction } from "@/hooks/use-server-action";
import {
  emailOtpCodeSchema,
  emailOtpRequestSchema,
  type EmailOtpCodeSchema,
  type EmailOtpRequestSchema,
} from "@/modules/auth/auth.schema";

const loginErrorMessages: Record<string, Record<Locale, string>> = {
  admin: {
    es: "Las cuentas de administrador deben iniciar sesión en Acceso administrativo.",
    en: "Admin accounts must log in via the admin access page.",
  },
  auth: {
    es: "No se pudo iniciar sesión. Solicita un nuevo enlace o código desde tu email.",
    en: "Sign-in failed. Request a new link or code via your email.",
  },
  pending_business: {
    es: "Tu cuenta de empresa está pendiente de aprobación. Te avisaremos por correo cuando puedas entrar.",
    en: "Your business account is pending admin approval. We'll notify you once it's ready.",
  },
  rejected_business: {
    es: "Tu solicitud de empresa no fue aprobada. Contacta con soporte si necesitas más información.",
    en: "Your business application was rejected. Contact support for more details.",
  },
};

const OTP_COOLDOWN_SECONDS = 60;
const OTP_COOLDOWN_MS = OTP_COOLDOWN_SECONDS * 1000;
const languageLabelKey = LANGUAGE_LABEL_KEY;

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, t, supportedLocales, setLocale } = useI18n();
  const loginError = useMemo(() => {
    const code = searchParams.get("error");
    if (!code) return null;
    return loginErrorMessages[code]?.[locale] ?? t("login.errors.default");
  }, [searchParams, locale, t]);

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
      const res = await fetch(
        `/api/otp/cooldown?email=${encodeURIComponent(email)}`,
      );
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
      successMessage: t("login.toast.otpSent"),
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
      successMessage: t("login.toast.signedIn"),
      onSuccess: () => {
        router.push("/");
        router.refresh();
      },
    },
  );

  const emailErrors = emailForm.formState.errors;
  const codeErrors = codeForm.formState.errors;
  const isCooldownActive = Boolean(blockedUntil && cooldownSeconds > 0);
  const cooldownRetryMessage = t("login.cooldown.retry").replace(
    "{seconds}",
    String(cooldownSeconds),
  );

  return (
    <AuthLayout>
      <AuthBrandHeader />
      <AuthCard>
        <div className="mb-4 flex justify-end gap-2 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          {supportedLocales.map((lang: Locale) => {
            const isActive = lang === locale;
            return (
              <button
                key={lang}
                type="button"
                className={`rounded-full px-3 py-1 transition ${isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
                  }`}
                onClick={() => setLocale(lang)}
                aria-pressed={isActive}
              >
                {t(LANGUAGE_LABEL_KEY[lang])}
              </button>
            );
          })}
        </div>
        <AuthHeading
          title={t("login.heading.title")}
          description={t("login.heading.description")}
        />

        {loginError ? <AuthAlert>{loginError}</AuthAlert> : null}

        {step === "email" ? (
          <Form
            form={emailForm}
            onSubmit={handleEmailSubmit}
            className="space-y-4"
          >
            <AuthField
              name="email"
              label={t("login.emailLabel")}
              type="email"
              autoComplete="email"
              required
              error={emailErrors.email?.message}
            />
            <AuthPrimaryButton
              type="submit"
              pending={sending}
              pendingLabel={t("login.buttons.sending")}
              disabled={sending || isCooldownActive}
            >
              {isCooldownActive
                ? `${t("login.buttons.verifyOtp")} (${cooldownSeconds}s)`
                : t("login.buttons.continue")}
            </AuthPrimaryButton>
            {isCooldownActive ? (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  {isFetchingCooldown
                    ? t("login.cooldown.checking")
                    : cooldownRetryMessage}
                </p>
                <AuthInlineLinkRow>
                  <span>{t("login.links.alreadyHaveCode")}</span>
                  <button
                    type="button"
                    className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
                    onClick={handleGoToVerify}
                  >
                    {t("login.buttons.verifyOtp")}
                  </button>
                </AuthInlineLinkRow>
              </div>
            ) : null}
          </Form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                {t("login.codeSentPrefix")}
              </span>
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
                <Label htmlFor="otp-code">{t("login.codeLabel")}</Label>
                <AuthInput
                  id="otp-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  maxLength={6}
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
                pendingLabel={t("login.buttons.verifying")}
              >
                {t("login.buttons.submitCode")}
              </AuthPrimaryButton>
              <div className="text-center text-sm leading-relaxed text-muted-foreground">
                <AuthInlineLinkRow>
                  <span>{t("login.links.notYourEmail")}</span>
                  <button
                    type="button"
                    className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
                    onClick={() => {
                      setStep("email");
                      codeForm.reset({ code: "" });
                    }}
                  >
                    {t("login.links.changeEmail")}
                  </button>
                </AuthInlineLinkRow>
              </div>
            </Form>
          </div>
        )}

        {step === "email" ? (
          <AuthFooterLinks>
            <AuthInlineLinkRow>
              <span>{t("login.links.businessPrompt")}</span>
              <Link
                href="/register/empresa"
                className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
              >
                {t("login.links.businessLink")}
              </Link>
            </AuthInlineLinkRow>
            <AuthInlineLinkRow>
              <span>{t("login.links.adminPrompt")}</span>
              <Link
                href="/admin/login"
                className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
              >
                {t("login.links.adminLink")}
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
