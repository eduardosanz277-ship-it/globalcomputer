import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { getNavigationData } from "@/modules/navigation/navigation.service";
import Link from "next/link";

export default async function ServicesPage() {
  const nav = await getNavigationData();
  const services = nav?.services ?? [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <HomeSectionHeading
        eyebrow="Servicios"
        title="Nuestros servicios"
        description="Lista completa de servicios disponibles."
      />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <article
            key={s.id}
            className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm"
          >
            <h3 className="font-display text-lg font-semibold text-foreground">
              {s.name}
            </h3>
            {s.description ? (
              <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
            ) : null}
            <div className="mt-4">
              <Link
                href={`/services/${s.id}`}
                className="inline-flex items-center rounded-xl bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground"
              >
                Ver servicio
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

