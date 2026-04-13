import Link from "next/link";
import Image from "next/image";
import { Poppins } from "next/font/google";
import {
  ArrowUpRight,
  MessageCircle,
  Truck,
  ShieldCheck,
  Wrench,
  MessageSquare,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/utils/cn";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
});

type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  service_images?: Array<{
    id: string;
    url: string;
    is_primary: boolean;
    sort_order: number | null;
  }> | null;
};

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

function iconForServiceName(name: string) {
  const n = name.toLowerCase();
  if (n.includes("instal") || n.includes("mont")) return Wrench;
  if (n.includes("manten") || n.includes("soporte") || n.includes("revision"))
    return ShieldCheck;
  if (n.includes("asesor") || n.includes("consulta") || n.includes("recom"))
    return MessageSquare;
  return Truck;
}

function clampText(text: string, maxLen: number) {
  const t = text.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1)}…`;
}

function resolvePrimaryServiceImage(
  images: ServiceRow["service_images"],
): string | null {
  if (!images || images.length === 0) return null;
  const ordered = images
    .slice()
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return (a.sort_order ?? 9999) - (b.sort_order ?? 9999);
    })
    .filter((img) => Boolean(img.url));
  return ordered[0]?.url ?? null;
}

export async function ServicesSection() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("services")
    .select(
      "id, name, description, service_images(id, url, is_primary, sort_order)",
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
          href: `/services/${s.id}`,
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
          {list.map((s) => {
            const Icon = iconForServiceName(s.name);
            return (
              <Link
                key={s.id}
                href={s.href}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft transition duration-300 hover:-translate-y-1.5 hover:shadow-soft-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
              >
                <div className="relative aspect-[16/10] overflow-hidden border-b border-border/50">
                  {s.imageUrl ? (
                    <Image
                      src={s.imageUrl}
                      alt={s.name}
                      fill
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 48vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/20 via-card to-muted/50" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3
                    className={cn(
                      poppins.className,
                      "text-lg font-semibold leading-snug text-foreground transition group-hover:text-primary",
                    )}
                  >
                    {s.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {clampText(s.description, 130)}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition group-hover:bg-primary/90">
                      Ver servicio
                      <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                    <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border/70 bg-background/90 px-4 text-sm font-semibold text-foreground/90 backdrop-blur-sm transition group-hover:border-primary/30 group-hover:bg-primary/[0.04]">
                      Hablar con asesor
                      <MessageCircle className="h-4 w-4" aria-hidden />
                    </span>
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent opacity-0 transition group-hover:opacity-100" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
