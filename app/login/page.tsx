"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";

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
  AuthBackToHome,
} from "@/components/auth";
import { AuthPageSuspenseFallback } from "@/components/auth/auth-page-suspense-fallback";
import { useI18n } from "@/components/i18n/I18nProvider";
import { LANGUAGE_LABEL_KEY, type Locale } from "@/components/i18n/translations";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { useServerAction } from "@/hooks/use-server-action";
import { markLoginSuccessToast } from "@/lib/login-success-toast";
import { Loader2 } from "lucide-react";
import {
  createEmailOtpCodeSchema,
  createEmailOtpRequestSchema,
  type EmailOtpCodeSchema,
  type EmailOtpRequestSchema,
} from "@/modules/auth/auth.schema";

const loginErrorKeys: Record<string, string> = {
  admin: "login.errors.adminPortalRequired",
  auth: "login.errors.default",
  pending_business: "login.errors.pendingBusiness",
  rejected_business: "login.errors.rejectedBusiness",
};

const OTP_COOLDOWN_SECONDS = 60;
const OTP_COOLDOWN_MS = OTP_COOLDOWN_SECONDS * 1000;
const languageLabelKey = LANGUAGE_LABEL_KEY;

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, t, supportedLocales, setLocale } = useI18n();
  const loginError = useMemo(() => {
    const code = searchParams.get("error");
    if (!code) return null;
    const key = loginErrorKeys[code];
    return key ? t(key) : t("login.errors.default");
  }, [searchParams, t, locale]);

  const [step, setStep] = useState<"email" | "code">("email");
  const [emailForCode, setEmailForCode] = useState("");
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState<Date | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isFetchingCooldown, setIsFetchingCooldown] = useState(false);

  const emailResolver = useCallback<Resolver<EmailOtpRequestSchema>>(
    async (values, context, options) => {
      const schema = createEmailOtpRequestSchema({
        emailRequired: t("login.form.errors.emailRequired"),
        emailInvalid: t("login.form.errors.emailInvalid"),
      });
      return zodResolver(schema)(values, context, options);
    },
    [t, locale],
  );

  const codeResolver = useCallback<Resolver<EmailOtpCodeSchema>>(
    async (values, context, options) => {
      const schema = createEmailOtpCodeSchema({
        codeRequired: t("login.form.errors.codeRequired"),
        codeFormat: t("login.form.errors.codeFormat"),
      });
      return zodResolver(schema)(values, context, options);
    },
    [t, locale],
  );

  const emailForm = useForm<EmailOtpRequestSchema>({
    resolver: emailResolver,
    defaultValues: { email: "" },
  });

  const codeForm = useForm<EmailOtpCodeSchema>({
    resolver: codeResolver,
    defaultValues: { code: "" },
  });

  useEffect(() => {
    if (emailForm.formState.isSubmitted) {
      void emailForm.trigger();
    }
  }, [locale, emailForm]);

  useEffect(() => {
    if (codeForm.formState.isSubmitted) {
      void codeForm.trigger();
    }
  }, [locale, codeForm]);

  const watchedEmail = emailForm.watch("email") ?? "";

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
      const res = await sendLoginOtpAction(email, locale);
      if (!res.ok) throw new Error(res.message);
      return res;
    },
    {
      successMessage: t("login.toast.otpSent"),
      errorMessage: t("login.errors.default"),
      onSuccess: () => {
        const e =
          emailForm.getValues("email").trim().toLowerCase() || emailForCode;
        setEmailForCode(e);
        codeForm.reset({ code: "" });
        setIsEditingEmail(false);
        setStep("code");
        setBlockedUntil(new Date(Date.now() + OTP_COOLDOWN_MS));
      },
    },
  );

  const handleEmailSubmit = async (values: EmailOtpRequestSchema) => {
    const email = values.email.trim().toLowerCase();
    if (
      blockedUntil &&
      blockedUntil.getTime() > Date.now() &&
      email === emailForCode
    ) {
      setStep("code");
      return;
    }
    sendOtp(email);
  };

  const startEditEmail = useCallback(() => {
    emailForm.setValue("email", emailForCode);
    setIsEditingEmail(true);
  }, [emailForCode, emailForm]);

  const cancelEditEmail = useCallback(() => {
    emailForm.setValue("email", emailForCode);
    setIsEditingEmail(false);
  }, [emailForCode, emailForm]);

  const handleBackToSignIn = useCallback(() => {
    emailForm.setValue("email", emailForCode);
    codeForm.reset({ code: "" });
    setIsEditingEmail(false);
    setStep("email");
  }, [emailForCode, emailForm, codeForm]);

  const handleSaveEmail = (values: EmailOtpRequestSchema) => {
    const email = values.email.trim().toLowerCase();
    const previousEmail = emailForCode;
    setEmailForCode(email);
    setIsEditingEmail(false);
    codeForm.reset({ code: "" });

    if (email !== previousEmail) {
      sendOtp(email);
      return;
    }

    void fetchCooldown(email);
  };

  const handleResendCode = () => {
    if (!emailForCode || isCooldownActive || sending) return;
    emailForm.setValue("email", emailForCode);
    sendOtp(emailForCode);
  };

  useEffect(() => {
    if (step !== "email" || watchedEmail.trim()) return;
    setBlockedUntil(null);
  }, [step, watchedEmail]);

  useEffect(() => {
    if (step !== "code" || !emailForCode) return;
    void fetchCooldown(emailForCode);
  }, [step, emailForCode, fetchCooldown]);

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
    async (email: string, code: string) => {
      const res = await verifyLoginOtpAction(email, code, locale);
      if (!res.ok) throw new Error(res.message);
      return res;
    },
    {
      errorMessage: t("login.errors.default"),
      onSuccess: () => {
        markLoginSuccessToast();
        router.push("/");
        router.refresh();
      },
    },
  );

  const emailErrors = emailForm.formState.errors;
  const codeErrors = codeForm.formState.errors;
  const isCooldownActive = Boolean(blockedUntil && cooldownSeconds > 0);
  const resendCountdownLabel = t("login.verify.resendIn").replace(
    "{time}",
    formatCountdown(cooldownSeconds),
  );

  const verifyHeadingDescription =
    step === "code" && !isEditingEmail ? (
      <>
        {t("login.verify.subtitlePrefix")}{" "}
        <span className="font-medium text-foreground break-all">
          {emailForCode}
        </span>
        {" · "}
        <button
          type="button"
          className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
          onClick={startEditEmail}
        >
          {t("login.verify.changeEmail")}
        </button>
      </>
    ) : undefined;

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
                className={`rounded-full px-3 py-1 transition ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
                }`}
                onClick={() => setLocale(lang)}
                aria-pressed={isActive}
              >
                {t(languageLabelKey[lang])}
              </button>
            );
          })}
        </div>
        <AuthHeading
          title={
            step === "code"
              ? t("login.verify.title")
              : t("login.heading.title")
          }
          description={
            step === "email"
              ? t("login.heading.description")
              : verifyHeadingDescription
          }
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
              disabled={sending}
            >
              {t("login.buttons.continue")}
            </AuthPrimaryButton>
          </Form>
        ) : (
          <div className="space-y-4">
            {isEditingEmail ? (
              <Form
                form={emailForm}
                onSubmit={handleSaveEmail}
                className="space-y-3 text-left"
              >
                <AuthField
                  name="email"
                  label={t("login.emailLabel")}
                  type="email"
                  autoComplete="email"
                  required
                  error={emailErrors.email?.message}
                />
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
                    onClick={cancelEditEmail}
                  >
                    {t("login.verify.cancelEdit")}
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {t("login.verify.saveEmail")}
                  </button>
                </div>
              </Form>
            ) : null}

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

              <p className="text-sm text-muted-foreground">
                {t("login.verify.resendPrompt")}{" "}
                {sending ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-foreground/80">
                    <Loader2
                      className="h-3.5 w-3.5 animate-spin"
                      aria-hidden
                    />
                    {t("login.verify.resendingOtp")}
                  </span>
                ) : isFetchingCooldown ? (
                  <span>{t("login.cooldown.checking")}</span>
                ) : isCooldownActive ? (
                  <span>{resendCountdownLabel}</span>
                ) : (
                  <button
                    type="button"
                    className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
                    onClick={handleResendCode}
                  >
                    {t("login.verify.resendLink")}
                  </button>
                )}
              </p>

              <AuthPrimaryButton
                type="submit"
                pending={verifying}
                pendingLabel={t("login.buttons.verifying")}
              >
                {t("login.buttons.submitCode")}
              </AuthPrimaryButton>
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
      {step === "email" ? (
        <AuthBackToHome />
      ) : (
        <AuthBackToHome
          onClick={handleBackToSignIn}
          label={t("login.links.backToSignIn")}
        />
      )}
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthPageSuspenseFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
