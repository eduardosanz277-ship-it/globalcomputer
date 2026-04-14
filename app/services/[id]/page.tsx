import { Inter } from "next/font/google";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { ServiceDescriptionContent } from "@/components/services/ServiceDescriptionContent";

type Props = {
  params: { id: string };
};

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default async function ServiceDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("services")
    .select(
      "id, name, description, service_images(id, url, is_primary, sort_order)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load service", error);
    return (
      <main className="min-h-[60vh] bg-gradient-to-b from-muted/25 to-background">
        <div className="border-b border-border/60 bg-card/40">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <MarketingBreadcrumb
              items={[
                { label: "Inicio", href: "/" },
                { label: "Servicios", href: "/services" },
                { label: "Detalle" },
              ]}
              className={inter.className}
            />
            <div className="mt-4">
              <HomeSectionHeading
                className="max-w-none"
                align="left"
                eyebrow="Servicio"
                title="Error al cargar el servicio"
                description="No se pudo obtener la información del servicio. Intenta nuevamente más tarde."
                titleClassName={`${inter.className} text-[28px] font-bold tracking-[0.006em] text-foreground sm:text-[32px]`}
                descriptionClassName={`${inter.className} mt-1 w-full max-w-none text-[15px] font-normal text-muted-foreground sm:text-base`}
              />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return notFound();
  }

  const serviceImages = (
    (data.service_images ?? []) as Array<{
      id: string;
      url: string;
      is_primary: boolean;
      sort_order: number | null;
    }>
  )
    .slice()
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });
  const primaryImageUrl = serviceImages[0]?.url ?? null;

  return (
    <main className="min-h-[60vh] bg-gradient-to-b from-muted/25 to-background">
      <div className="border-b border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <MarketingBreadcrumb
            items={[
              { label: "Inicio", href: "/" },
              { label: "Servicios", href: "/services" },
              { label: data.name },
            ]}
            className={inter.className}
          />
          <div className="mt-4">
            <HomeSectionHeading
              className="max-w-none"
              align="left"
              title={data.name}
              // description="Una experiencia actual y cuidada pensada para inspirar confianza y mostrar lo mejor del servicio."
              titleClassName={`${inter.className} text-[28px] font-bold tracking-[0.006em] text-foreground sm:text-[32px]`}
              descriptionClassName={`${inter.className} mt-1 w-full max-w-none text-[15px] font-normal text-muted-foreground sm:text-base`}
            />
          </div>
        </div>
      </div>

      {primaryImageUrl ? (
        <section className="relative w-full overflow-hidden border-y border-border/40 bg-black/90">
          <div className="relative h-[46vh] min-h-[17rem] w-full sm:h-[56vh] lg:h-[64vh]">
            {/* Capa de fondo para mantener impacto visual a todo ancho */}
            <Image
              src={primaryImageUrl}
              alt=""
              fill
              sizes="100vw"
              quality={75}
              priority
              className="object-cover object-center opacity-40 blur-sm scale-105"
              aria-hidden
            />
            {/* Imagen principal prioriza nitidez y evita recortes agresivos */}
            <Image
              src={primaryImageUrl}
              alt={data.name}
              fill
              sizes="100vw"
              quality={75}
              priority
              className="object-contain object-center"
            />
          </div>
        </section>
      ) : null}

      <div className="relative z-10 mx-auto -mt-6 max-w-7xl px-4 pb-12 sm:-mt-10 sm:px-6 lg:-mt-14 lg:px-8">
        {/* Contenido anterior de detalle de servicio (galería + CTA), preservado por referencia.
        <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-b from-primary/10 via-background to-background shadow-2xl shadow-primary/20">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6">
              <div className="rounded-2xl bg-card/80 p-4 shadow-lg shadow-black/20 backdrop-blur">
                <ServiceGallery
                  images={(data.service_images ?? [])
                    .slice()
                    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                    .map((i: any) => ({ id: i.id, url: i.url }))}
                />
              </div>
            </div>
            <div className="border-t border-border/40 p-6 lg:border-l lg:border-t-0">
              <ServiceDescriptionCollapsible description={data.description} />
              <div className="mt-8 flex flex-wrap gap-3">
                <button className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-foreground transition hover:bg-primary/90">
                  Solicita asesoría
                </button>
                <button className="rounded-full border border-primary/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary transition hover:bg-primary/10">
                  Compartir
                </button>
              </div>
            </div>
          </div>
        </section>
        */}
        <ServiceDescriptionContent description={data.description} />
      </div>
    </main>
  );
}
