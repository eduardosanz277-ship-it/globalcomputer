"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { landingSectionPaddingYClass } from "@/components/marketing/landing-section-classes";
import {
  resolvePrimaryServiceImage,
  type ServiceRow,
} from "@/components/marketing/service-card-shared";
import { ServiceCardLink } from "@/components/marketing/ServiceCardLink";
import type { HeroContact } from "@/components/marketing/StoreHero";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/utils/cn";
import { PhoneCall } from "lucide-react";
import Link from "next/link";

const fallbackServices: Array<{
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  key: "installation" | "maintenance" | "advisory";
}> = [
  {
    name: "Instalación profesional",
    nameEn: "Professional installation",
    description:
      "Te ayudamos a montar y configurar tu sistema para que funcione desde el día 1.",
    descriptionEn:
      "We help you install and configure your system so it works from day one.",
    key: "installation",
  },
  {
    name: "Mantenimiento",
    nameEn: "Maintenance",
    description:
      "Revisiones y soporte técnico para mantener el rendimiento y la seguridad.",
    descriptionEn:
      "Checkups and technical support to preserve performance and security.",
    key: "maintenance",
  },
  {
    name: "Asesoría personalizada",
    nameEn: "Personalized advisory",
    description:
      "Recomendaciones según tu espacio, presupuesto y nivel de seguridad requerido.",
    descriptionEn:
      "Recommendations tailored to your space, budget, and required security level.",
    key: "advisory",
  },
];

export type ServiceWithI18n = ServiceRow & {
  name_en?: string | null;
  description_en?: string | null;
};

export function ServicesSection({
  services,
  contact,
}: {
  services: ServiceWithI18n[];
  contact: HeroContact;
}) {
  const { locale } = useI18n();
  const t = (es: string, en?: string | null) =>
    locale === "en" ? en?.trim() || es : es;

  const list =
    services.length > 0
      ? services.map((s) => ({
          id: s.id,
          name: t(s.name, s.name_en),
          description: t(s.short_description ?? "", s.short_description_en),
          imageUrl: resolvePrimaryServiceImage(s.service_images),
          href: `/services/${s.slug ?? s.id}`,
        }))
      : fallbackServices.map((s, idx) => ({
          id: `fallback-${idx}`,
          name: t(s.name, s.nameEn),
          description: t(s.description, s.descriptionEn),
          imageUrl: "/images/camaras_de_seguridad.webp",
          href: "#ayuda",
        }));

  return (
    <section
      id="servicios"
      className={cn(
        "scroll-mt-32 border-b border-border bg-muted/40 sm:scroll-mt-36",
        landingSectionPaddingYClass,
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6 lg:gap-8">
          <HomeSectionHeading
            align="left"
            title={t(
              "Servicios para tu instalación",
              "Services for your installation",
            )}
            description={t(
              "Instalación profesional, mantenimiento preventivo y asesoría especializada para que tu sistema de seguridad funcione siempre sin complicaciones.",
              "Professional installation, preventive maintenance, and specialized advisory so your security system keeps working without complications.",
            )}
            className="min-w-0 max-w-3xl flex-1"
            titleClassName="text-3xl sm:text-4xl"
          />
          {contact.phoneTel ? (
            <Link
              href={`tel:${contact.phoneTel}`}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full shrink-0 gap-2 rounded-full border-primary/30 bg-card px-5 font-semibold hover:bg-primary/5 sm:w-auto",
              )}
              aria-label={`${t("Hablar con un asesor", "Talk to an advisor")} (${contact.phoneDisplay})`}
            >
              <PhoneCall className="h-4 w-4 shrink-0" aria-hidden />
              {t("Hablar con un asesor", "Talk to an advisor")}
            </Link>
          ) : null}
        </div>

        <div className="mt-6 lg:mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [&>*]:min-h-0">
          {list.map((s) => (
            <ServiceCardLink
              key={s.id}
              name={s.name}
              description={s.description}
              imageUrl={s.imageUrl}
              href={s.href}
              showAdvisorCta={false}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
