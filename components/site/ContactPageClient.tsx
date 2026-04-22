"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
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
import { siteContactMapsUrl, SITE_CONTACT_SUPPORT_HOURS } from "@/lib/site";
import {
  contactRequestFormSchema,
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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-0 dark:bg-card",
  "placeholder:text-muted-foreground/70",
);
const TEXTAREA_CLASS = cn(
  "min-h-[148px] w-full resize-y rounded-xl border border-border/80 bg-white px-3 py-2.5 text-sm shadow-sm transition",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-card",
  "placeholder:text-muted-foreground/70",
);
const CONTACT_MAP_CENTER: [number, number] = [
  25.567028063498697, -80.37994839738671,
];
const CONTACT_MAP_GOOGLE_MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=25.567028063498697,-80.37994839738671";

type Props = {
  contact: PublicSiteContact;
};

export function ContactPageClient({ contact }: Props) {
  const form = useForm<ContactRequestFormValues>({
    resolver: zodResolver(contactRequestFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
    mode: "onSubmit",
  });

  const {
    register,
    formState: { errors, isSubmitting },
    reset,
  } = form;

  const cards = useMemo(
    () => [
      {
        id: "phone",
        title: "Teléfono",
        value: contact.phoneDisplay,
        href: `tel:${contact.phoneTel}`,
        icon: PhoneCall,
      },
      {
        id: "email",
        title: "Correo electrónico",
        value: contact.email,
        href: `mailto:${contact.email}`,
        icon: Mail,
      },
      {
        id: "address",
        title: "Dirección",
        value: contact.address,
        href: siteContactMapsUrl(contact.address),
        icon: MapPin,
      },
      {
        id: "hours",
        title: "Horario de atención",
        value: SITE_CONTACT_SUPPORT_HOURS,
        href: null,
        icon: Clock3,
      },
    ],
    [contact],
  );

  const onSubmit = async (values: ContactRequestFormValues) => {
    try {
      const response = await fetch("/api/contact-requests", {
        method: "POST",
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("request_failed");
      }

      reset();
      toast.success("Mensaje enviado correctamente");
    } catch {
      toast.error("No se pudo enviar el mensaje");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[45fr_55fr] lg:items-start">
        <section className="space-y-5">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.09] via-card to-card p-5 shadow-soft sm:p-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              Soporte especializado
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              Cuéntanos tu necesidad y te ayudamos con asesoría, instalación y
              soporte técnico para cámaras y sistemas de monitoreo.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {cards.map(({ id, title, value, href, icon: Icon }) => (
              <article
                key={id}
                className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-soft-lg sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                    <Icon className="h-6 w-6" aria-hidden />
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

        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft sm:p-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Envíanos un mensaje
            </h2>
            <p className="text-sm text-muted-foreground">
              Te responderemos en el menor tiempo posible.
            </p>
          </div>

          <Form form={form} onSubmit={onSubmit} className="mt-5 space-y-4">
            <FormField
              name="name"
              label="Nombre"
              required
              disabled={isSubmitting}
              error={errors.name?.message}
              autoComplete="name"
              className={INPUT_CLASS}
              placeholder="Tu nombre completo"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                name="email"
                label="Correo electrónico"
                type="email"
                required
                disabled={isSubmitting}
                error={errors.email?.message}
                autoComplete="email"
                className={INPUT_CLASS}
                placeholder="correo@ejemplo.com"
              />
              <FormField
                name="phone"
                label="Teléfono"
                required
                disabled={isSubmitting}
                error={errors.phone?.message}
                autoComplete="tel"
                className={INPUT_CLASS}
                placeholder="786-395-1076"
              />
            </div>

            <FormField
              name="subject"
              label="Asunto"
              required
              disabled={isSubmitting}
              error={errors.subject?.message}
              autoComplete="off"
              className={INPUT_CLASS}
              placeholder="¿En qué podemos ayudarte?"
            />

            <div className="space-y-2">
              <Label htmlFor="contact-message">
                Mensaje
                <RequiredMark />
              </Label>
              <textarea
                id="contact-message"
                placeholder="Cuéntanos lo que necesitas: tipo de proyecto, ubicación y horario de preferencia."
                disabled={isSubmitting}
                aria-invalid={errors.message ? true : undefined}
                aria-describedby={
                  errors.message ? "contact-message-error" : undefined
                }
                className={TEXTAREA_CLASS}
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

            <Button
              type="submit"
              className="h-11 w-full rounded-xl font-semibold sm:w-auto sm:px-8"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    className="mr-2 h-4 w-4 shrink-0 animate-spin"
                    aria-hidden
                  />
                  Enviando mensaje
                </>
              ) : (
                <>
                  <SendHorizontal className="mr-2 h-4 w-4" aria-hidden />
                  Enviar mensaje
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
