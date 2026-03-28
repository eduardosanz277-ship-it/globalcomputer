import { notFound } from "next/navigation";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { ServiceGallery } from "@/components/services/ServiceGallery";

type Props = {
  params: { id: string };
};

export default async function ServiceDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("services")
    .select(
      "id, name, description, service_images(id, url, is_primary, sort_order)"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load service", error);
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <HomeSectionHeading
          eyebrow="Servicio"
          title="Error al cargar el servicio"
          description="No se pudo obtener la información del servicio. Intenta nuevamente más tarde."
        />
      </main>
    );
  }

  if (!data) {
    return notFound();
  }

  const images =
    (data.service_images ?? [])
      .slice()
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) ?? [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <HomeSectionHeading
        eyebrow="Servicio"
        title={data.name}
        description="Una experiencia actual y cuidada pensada para inspirar confianza y mostrar lo mejor del servicio."
      />

      <section className="mt-8 overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-b from-primary/10 via-background to-background shadow-2xl shadow-primary/20">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-6">
            <div className="rounded-2xl bg-card/80 p-4 shadow-lg shadow-black/20 backdrop-blur">
              <ServiceGallery images={images.map((i: any) => ({ id: i.id, url: i.url }))} />
            </div>
          </div>
          <div className="p-6 border-t border-border/40 lg:border-t-0 lg:border-l">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                Tendencias
              </span>
              <span className="text-xs font-medium text-muted-foreground">Actualizado</span>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-foreground">Descripción</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {data.description ?? "No hay descripción disponible en este momento."}
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
    </main>
  );
}

