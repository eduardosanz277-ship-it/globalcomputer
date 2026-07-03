"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import {
  resolvePrimaryServiceImage,
  type ServiceRow,
} from "@/components/marketing/service-card-shared";
import { ServiceCardLink } from "@/components/marketing/ServiceCardLink";

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

export function ServicesSection({ services }: { services: ServiceWithI18n[] }) {
  const { locale } = useI18n();
  const t = (es: string, en?: string | null) =>
    locale === "en" ? en?.trim() || es : es;

  const list =
    services.length > 0
      ? services.map((s) => ({
          id: s.id,
          name: t(s.name, s.name_en),
          description: t(s.description ?? "", s.description_en),
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
      className="scroll-mt-32 border-b border-border bg-muted/40 py-16 sm:scroll-mt-36 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <HomeSectionHeading
            align="left"
            // eyebrow="Servicios"
            title={t(
              "Servicios para tu instalación",
              "Services for your installation",
            )}
            description={t(
              "Instalación profesional, mantenimiento preventivo y asesoría especializada para que tu sistema de seguridad funcione siempre sin complicaciones.",
              "Professional installation, preventive maintenance, and specialized advisory so your security system keeps working without complications.",
            )}
            className="max-w-none"
            titleClassName="text-3xl sm:text-4xl"
          />
          {/*
          <div className="flex flex-wrap gap-3 lg:shrink-0">
            <Link
              href="#ayuda"
              className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "rounded-full shadow-sm",
              )}
            >
              Solicitar instalación
            </Link>
            <Link
              href="#ayuda"
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "rounded-full border-primary/30 bg-background hover:bg-primary/5",
              )}
            >
              Hablar con asesor
            </Link>
          </div>
          */}
        </div>

        <div className="mt-6 lg:mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <ServiceCardLink
              key={s.id}
              name={s.name}
              description={s.description}
              imageUrl={s.imageUrl}
              href={s.href}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
