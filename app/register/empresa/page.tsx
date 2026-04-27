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
import { useI18n } from "@/components/i18n/I18nProvider";
import { LANGUAGE_LABEL_KEY, type Locale } from "@/components/i18n/translations";

export default function RegisterEmpresaPage() {
  const router = useRouter();
  const { locale, t, supportedLocales, setLocale } = useI18n();

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
    successMessage: t("registerBusiness.toast.success"),
    errorMessage: t("registerBusiness.toast.error"),
    onSuccess: () => router.push("/login"),
  });

  const errors = form.formState.errors;

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
            autoComplete="tel"
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
            autoComplete="off"
            placeholder={t("registerBusiness.fields.einPlaceholder")}
            error={errors.employerIdentificationNumber?.message}
          />
          <AuthPrimaryButton
            type="submit"
            pending={isPending}
            pendingLabel={t("registerBusiness.buttons.pending")}
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
    </AuthLayout>
  );
}
