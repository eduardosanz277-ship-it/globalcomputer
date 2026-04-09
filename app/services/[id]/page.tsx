import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { ServiceGallery } from "@/components/services/ServiceGallery";

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

  const images =
    (data.service_images ?? [])
      .slice()
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) ??
    [];

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
              description="Una experiencia actual y cuidada pensada para inspirar confianza y mostrar lo mejor del servicio."
              titleClassName={`${inter.className} text-[28px] font-bold tracking-[0.006em] text-foreground sm:text-[32px]`}
              descriptionClassName={`${inter.className} mt-1 w-full max-w-none text-[15px] font-normal text-muted-foreground sm:text-base`}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-b from-primary/10 via-background to-background shadow-2xl shadow-primary/20">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6">
              <div className="rounded-2xl bg-card/80 p-4 shadow-lg shadow-black/20 backdrop-blur">
                <ServiceGallery
                  images={images.map((i: any) => ({ id: i.id, url: i.url }))}
                />
              </div>
            </div>
            <div className="border-t border-border/40 p-6 lg:border-l lg:border-t-0">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                  Tendencias
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  Actualizado
                </span>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">
                Descripción
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {data.description ??
                  "No hay descripción disponible en este momento."}
              </p>
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
      </div>
    </main>
  );
}
