"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatClientError } from "@/lib/errors/format-client-error";
import { toast } from "react-toastify";
import type { TurnstileInstance } from "@marsidev/react-turnstile";
import { TurnstileFit } from "@/components/site/TurnstileFit";
import {
  Clock3,
  Loader2,
  Mail,
  MapPin,
  PhoneCall,
  SendHorizontal,
  ShieldCheck,
} from "lucide-react";
import type { PublicSiteContact } from "@/lib/site";
import { siteContactMapsUrl } from "@/lib/site";
import {
  CONTACT_HONEYPOT_FIELD,
  US_PHONE_DIGIT_COUNT,
  createContactRequestFormSchema,
  type ContactRequestFormValues,
} from "@/modules/site/contact-requests.schema";
import { Form, FormField } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ContactMap } from "@/components/site/ContactMap";
import { Label, RequiredMark } from "@/components/ui/label";
import { cn } from "@/utils/cn";
import { SITE_BRAND_NAME } from "@/lib/site";

const INPUT_CLASS = cn(
  "h-11 w-full rounded-xl border border-border/80 bg-white px-3 py-2.5 text-sm shadow-sm transition",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-0",
  "placeholder:text-muted-foreground/70",
);
const TEXTAREA_CLASS = cn(
  "min-h-[148px] w-full resize-y rounded-xl border border-border/80 bg-white px-3 py-2.5 text-sm shadow-sm transition",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
  "placeholder:text-muted-foreground/70",
);
const CONTACT_MAP_CENTER: [number, number] = [
  25.567028063498697, -80.37994839738671,
];
const CONTACT_MAP_GOOGLE_MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=25.567028063498697,-80.37994839738671";

type Props = {
  contact: PublicSiteContact;
  initialSubject?: string;
};

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export function ContactPageClient({ contact, initialSubject = "" }: Props) {
  const { t, locale } = useI18n();
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const form = useForm<ContactRequestFormValues>({
    resolver: (values, context, options) =>
      zodResolver(
        createContactRequestFormSchema({
          nameRequired: t("contactPage.errors.nameRequired"),
          nameMin: t("contactPage.errors.nameMin"),
          nameMax: t("contactPage.errors.nameMax"),
          nameChars: t("contactPage.errors.nameChars"),
          emailRequired: t("contactPage.errors.emailRequired"),
          emailInvalid: t("contactPage.errors.emailInvalid"),
          emailMax: t("contactPage.errors.emailMax"),
          phoneRequired: t("contactPage.errors.phoneRequired"),
          phoneChars: t("contactPage.errors.phoneChars"),
          phoneInvalid: t("contactPage.errors.phoneInvalid"),
          phoneMax: t("contactPage.errors.phoneMax"),
          subjectRequired: t("contactPage.errors.subjectRequired"),
          subjectMin: t("contactPage.errors.subjectMin"),
          subjectMax: t("contactPage.errors.subjectMax"),
          subjectChars: t("contactPage.errors.subjectChars"),
          messageRequired: t("contactPage.errors.messageRequired"),
          messageMin: t("contactPage.errors.messageMin"),
          messageMax: t("contactPage.errors.messageMax"),
          messageChars: t("contactPage.errors.messageChars"),
          messageLinks: t("contactPage.errors.messageLinks"),
        }),
      )(values, context, options),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: initialSubject,
      message: "",
      [CONTACT_HONEYPOT_FIELD]: "",
    },
    mode: "onSubmit",
  });

  const {
    register,
    formState: { errors, isSubmitting },
    reset,
  } = form;
  // Si hay errores visibles y el usuario cambia de idioma,
  // se vuelven a validar para que los mensajes salgan en el locale actual.
  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) {
      void form.trigger();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const cards = useMemo(
    () => [
      {
        id: "phone",
        title: t("contactPage.cardPhone"),
        value: contact.phoneDisplay,
        href: `tel:${contact.phoneTel}`,
        icon: PhoneCall,
      },
      {
        id: "email",
        title: t("contactPage.cardEmail"),
        value: contact.email,
        href: `mailto:${contact.email}`,
        icon: Mail,
      },
      {
        id: "address",
        title: t("contactPage.cardAddress"),
        value: contact.address,
        href: siteContactMapsUrl(contact.address),
        icon: MapPin,
      },
      {
        id: "hours",
        title: t("contactPage.cardHours"),
        value: t("contactPage.supportHours"),
        href: null,
        icon: Clock3,
      },
    ],
    [contact, t],
  );

  const onSubmit = async (values: ContactRequestFormValues) => {
    if (!turnstileToken) {
      toast.error(t("contactPage.errors.turnstileFailed"));
      return;
    }
    try {
      const response = await fetch("/api/contact-requests", {
        method: "POST",
        body: JSON.stringify({ ...values, cf_turnstile_response: turnstileToken }),
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        cache: "no-store",
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };

      if (!response.ok) {
        // Rotar el widget para obtener un token fresco en el siguiente intento
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        if (response.status === 503 || data.code === "NETWORK") {
          throw new TypeError("Failed to fetch");
        }
        if (response.status === 429 || data.code === "RATE_LIMIT") {
          throw new Error(t("contactPage.errors.rateLimit"));
        }
        if (data.code === "TURNSTILE") {
          throw new Error(t("contactPage.errors.turnstileFailed"));
        }
        throw new Error(data.error ?? "request_failed");
      }

      reset();
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      toast.success(t("contactPage.toastSent"));
    } catch (error) {
      toast.error(
        formatClientError(error, t, {
          errorMessage: t("contactPage.toastError"),
        }),
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[45fr_55fr] lg:items-start">
        <section className="min-w-0 space-y-5">
          <div className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.09] via-card to-card p-4 shadow-soft sm:p-6">
            <div className="flex max-w-full flex-wrap items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-primary w-fit">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="min-w-0 break-words">{t("contactPage.supportBadge")}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              {t("contactPage.supportDescription")}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {cards.map(({ id, title, value, href, icon: Icon }) => (
              <article
                key={id}
                className="rounded-2xl border border-border/60 bg-card p-3 shadow-soft transition hover:-translate-y-0.5 hover:shadow-soft-lg sm:p-5"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 sm:h-12 sm:w-12">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:text-sm">
                      {title}
                    </p>
                    {href ? (
                      <a
                        href={href}
                        target={id === "address" ? "_blank" : undefined}
                        rel={
                          id === "address" ? "noopener noreferrer" : undefined
                        }
                        className={cn(
                          "mt-1.5 block min-w-0 text-sm font-medium leading-relaxed text-foreground transition hover:text-primary sm:text-base",
                          id === "email" && "break-all",
                          id === "address" && "break-words",
                        )}
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="mt-1.5 min-w-0 break-words text-sm font-medium leading-relaxed text-foreground sm:text-base">
                        {value}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="min-w-0 rounded-2xl border border-border/70 bg-card p-4 shadow-soft sm:p-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {t("contactPage.formTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("contactPage.formDescription")}
            </p>
          </div>

          <Form form={form} onSubmit={onSubmit} className="mt-5 space-y-4">
            <div className="sr-only" aria-hidden="true">
              <input
                id="contact-extra-info"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                {...register(CONTACT_HONEYPOT_FIELD)}
              />
            </div>
            <FormField
              name="name"
                label={t("contactPage.nameLabel")}
              required
              disabled={isSubmitting}
              error={errors.name?.message}
              autoComplete="name"
              className={INPUT_CLASS}
                placeholder={t("contactPage.namePlaceholder")}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                name="email"
                label={t("contactPage.emailLabel")}
                type="email"
                required
                disabled={isSubmitting}
                error={errors.email?.message}
                autoComplete="email"
                className={INPUT_CLASS}
                placeholder={t("contactPage.emailPlaceholder")}
              />
              <FormField
                name="phone"
                label={t("contactPage.phoneLabel")}
                type="tel"
                inputMode="tel"
                required
                disabled={isSubmitting}
                error={errors.phone?.message}
                autoComplete="tel"
                maxDigits={US_PHONE_DIGIT_COUNT}
                className={INPUT_CLASS}
                placeholder={t("contactPage.phonePlaceholder")}
              />
            </div>

            <FormField
              name="subject"
              label={t("contactPage.subjectLabel")}
              required
              disabled={isSubmitting}
              error={errors.subject?.message}
              autoComplete="off"
              maxLength={100}
              className={INPUT_CLASS}
              placeholder={t("contactPage.subjectPlaceholder")}
            />

            <div className="space-y-2">
              <Label htmlFor="contact-message">
                {t("contactPage.messageLabel")}
                <RequiredMark />
              </Label>
              <textarea
                id="contact-message"
                placeholder={t("contactPage.messagePlaceholder")}
                maxLength={2000}
                disabled={isSubmitting}
                aria-invalid={errors.message ? true : undefined}
                aria-describedby={
                  errors.message ? "contact-message-error" : undefined
                }
                className={cn(
                  TEXTAREA_CLASS,
                  errors.message &&
                    "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30",
                )}
                {...register("message")}
              />
              {errors.message?.message ? (
                <p
                  id="contact-message-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.message.message}
                </p>
              ) : null}
            </div>

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

            <Button
              type="submit"
              className="h-11 w-full rounded-xl font-semibold sm:w-auto sm:px-8"
              disabled={isSubmitting || !turnstileToken}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    className="mr-2 h-4 w-4 shrink-0 animate-spin"
                    aria-hidden
                  />
                  {t("contactPage.sending")}
                </>
              ) : (
                <>
                  <SendHorizontal className="mr-2 h-4 w-4" aria-hidden />
                  {t("contactPage.send")}
                </>
              )}
            </Button>
          </Form>
        </section>
      </div>

      <ContactMap
        businessName={SITE_BRAND_NAME}
        address={contact.address}
        center={CONTACT_MAP_CENTER}
        mapsUrl={CONTACT_MAP_GOOGLE_MAPS_URL}
      />
    </div>
  );
}
