import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { buttonVariants } from "@/components/ui/button-variants";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { cn } from "@/utils/cn";
import {
  resolvePrimaryServiceImage,
  type ServiceRow,
} from "@/components/marketing/service-card-shared";
import { ServiceCardLink } from "@/components/marketing/ServiceCardLink";

const fallbackServices: Array<{
  name: string;
  description: string;
  key: "installation" | "maintenance" | "advisory";
}> = [
  {
    name: "Instalación profesional",
    description:
      "Te ayudamos a montar y configurar tu sistema para que funcione desde el día 1.",
    key: "installation",
  },
  {
    name: "Mantenimiento",
    description:
      "Revisiones y soporte técnico para mantener el rendimiento y la seguridad.",
    key: "maintenance",
  },
  {
    name: "Asesoría personalizada",
    description:
      "Recomendaciones según tu espacio, presupuesto y nivel de seguridad requerido.",
    key: "advisory",
  },
];

export async function ServicesSection() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("services")
    .select(
      "id, name, slug, description, service_images(id, url, is_primary, sort_order)",
    )
    .limit(6);

  const services: ServiceRow[] = (data ?? []) as ServiceRow[];

  const list =
    services.length > 0
      ? services.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description ?? "",
          imageUrl: resolvePrimaryServiceImage(s.service_images),
          href: `/services/${s.slug ?? s.id}`,
        }))
      : fallbackServices.map((s, idx) => ({
          id: `fallback-${idx}`,
          name: s.name,
          description: s.description,
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
            title="Servicios para tu instalación"
            description="Instalación profesional, mantenimiento preventivo y asesoría especializada para que tu sistema de seguridad funcione siempre sin complicaciones."
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
