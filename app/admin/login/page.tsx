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
  AuthBackToHome,
} from "@/components/auth";
import { Form } from "@/components/ui/form";
import { adminLoginAction } from "@/app/admin/login/actions";
import { useServerAction } from "@/hooks/use-server-action";
import { loginSchema, type LoginSchema } from "@/modules/auth/auth.schema";
import { useI18n } from "@/components/i18n/I18nProvider";
import { LANGUAGE_LABEL_KEY, type Locale } from "@/components/i18n/translations";

export default function AdminLoginPage() {
  const router = useRouter();
  const { locale, t, supportedLocales, setLocale } = useI18n();

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { execute, isPending } = useServerAction(adminLoginAction, {
    successMessage: t("login.toast.signedIn"),
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
          title={t("adminLogin.heading.title")}
          description={t("adminLogin.heading.description")}
        />

        <Form form={form} onSubmit={onSubmit} className="space-y-4">
          <AuthField
            name="email"
            label={t("adminLogin.emailLabel")}
            type="email"
            required
            error={errors.email?.message}
          />
          <AuthField
            name="password"
            label={t("adminLogin.passwordLabel")}
            type="password"
            required
            error={errors.password?.message}
          />
          <AuthPrimaryButton
            type="submit"
            pending={isPending}
            pendingLabel={t("adminLogin.buttons.pending")}
          >
            {t("adminLogin.buttons.submit")}
          </AuthPrimaryButton>
        </Form>

        <AuthFooterLinks>
          <AuthInlineLinkRow>
            <span>{t("adminLogin.footer.clientPrompt")}</span>
            <Link
              href="/login"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
            >
              {t("adminLogin.footer.clientLink")}
            </Link>
          </AuthInlineLinkRow>
        </AuthFooterLinks>
      </AuthCard>
      <AuthBackToHome />
    </AuthLayout>
  );
}
