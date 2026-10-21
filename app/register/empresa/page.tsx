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
  AuthBackToHome,
} from "@/components/auth";
import { Form } from "@/components/ui/form";
import { useServerAction } from "@/hooks/use-server-action";
import {
  US_PHONE_DIGIT_COUNT,
  createRegisterBusinessSchema,
  type RegisterBusinessFormInput,
} from "@/modules/auth/auth.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { LANGUAGE_LABEL_KEY, type Locale } from "@/components/i18n/translations";
import type { TurnstileInstance } from "@marsidev/react-turnstile";
import { TurnstileFit } from "@/components/site/TurnstileFit";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export default function RegisterEmpresaPage() {
  const router = useRouter();
  const { locale, t, supportedLocales, setLocale } = useI18n();
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const form = useForm<RegisterBusinessFormInput>({
    resolver: (values, context, options) =>
      zodResolver(
        createRegisterBusinessSchema({
          businessNameRequired: t("contactPage.errors.nameRequired"),
          businessNameMin: t("contactPage.errors.nameMin"),
          businessNameMax: t("contactPage.errors.nameMax"),
          businessNameChars: t("contactPage.errors.nameChars"),
          emailRequired: t("contactPage.errors.emailRequired"),
          emailInvalid: t("contactPage.errors.emailInvalid"),
          emailMax: t("contactPage.errors.emailMax"),
          phoneChars: t("contactPage.errors.phoneChars"),
          phoneInvalid: t("registerBusiness.errors.phoneInvalid"),
          phoneMax: t("contactPage.errors.phoneMax"),
          einRequired: t("registerBusiness.errors.einRequired"),
          einDigits: t("registerBusiness.errors.einDigits"),
          einPrefix: t("registerBusiness.errors.einPrefix"),
        }),
      )(values, context, options),
    defaultValues: {
      businessName: "",
      phone: "",
      email: "",
      employerIdentificationNumber: "",
    },
  });

  const { execute, isPending } = useServerAction(
    async (values: RegisterBusinessFormInput) => {
      const res = await registerBusinessAction(values, locale, turnstileToken ?? undefined);
      if (!res.ok) {
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        throw new Error(res.message);
      }
      return res;
    },
    {
      successMessage: t("registerBusiness.toast.success"),
      errorMessage: t("registerBusiness.toast.error"),
      onSuccess: () => router.push("/login"),
    },
  );

  const errors = form.formState.errors;

  // Si hay errores visibles y el usuario cambia de idioma,
  // se vuelven a validar para que los mensajes salgan en el locale actual.
  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) {
      void form.trigger();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  return (
    <AuthLayout>
      <AuthBrandHeader />
      <AuthCard className="px-4 sm:px-8">
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
                {t(LANGUAGE_LABEL_KEY[lang])}
              </button>
            );
          })}
        </div>
        <AuthHeading
          title={t("registerBusiness.heading.title")}
          description={t("registerBusiness.heading.description")}
        />

        <Form form={form} onSubmit={(v) => execute(v)} className="space-y-4">
          <AuthField
            name="businessName"
            label={t("registerBusiness.fields.businessName")}
            required
            autoComplete="organization"
            error={errors.businessName?.message}
          />
          <AuthField
            name="phone"
            label={t("registerBusiness.fields.phone")}
            type="tel"
            inputMode="tel"
            required
            autoComplete="tel"
            maxDigits={US_PHONE_DIGIT_COUNT}
            placeholder={t("registerBusiness.fields.phonePlaceholder")}
            error={errors.phone?.message}
          />
          <AuthField
            name="email"
            label={t("registerBusiness.fields.email")}
            type="email"
            required
            autoComplete="email"
            error={errors.email?.message}
          />
          <AuthField
            name="employerIdentificationNumber"
            label={t("registerBusiness.fields.ein")}
            required
            inputMode="numeric"
            autoComplete="off"
            maxDigits={9}
            maxLength={11}
            placeholder={t("registerBusiness.fields.einPlaceholder")}
            error={errors.employerIdentificationNumber?.message}
          />
          <TurnstileFit
            ref={turnstileRef}
            siteKey={TURNSTILE_SITE_KEY}
            onSuccess={(token) => setTurnstileToken(token)}
            onExpire={() => setTurnstileToken(null)}
            onError={() => setTurnstileToken(null)}
            options={{
              theme: "light",
              language: locale === "es" ? "es" : "en",
              size: "flexible",
            }}
          />

          <AuthPrimaryButton
            type="submit"
            pending={isPending}
            pendingLabel={t("registerBusiness.buttons.pending")}
            disabled={isPending || !turnstileToken}
          >
            {t("registerBusiness.buttons.submit")}
          </AuthPrimaryButton>
        </Form>

        <AuthFooterLinks>
          <AuthInlineLinkRow>
            <span>{t("registerBusiness.footer.haveAccount")}</span>
            <Link
              href="/login"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
            >
              {t("registerBusiness.footer.signInLink")}
            </Link>
          </AuthInlineLinkRow>
        </AuthFooterLinks>
      </AuthCard>
      <AuthBackToHome />
    </AuthLayout>
  );
}
