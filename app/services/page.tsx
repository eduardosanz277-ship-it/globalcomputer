import { Inter } from "next/font/google";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { getNavigationData } from "@/modules/navigation/navigation.service";
import Link from "next/link";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default async function ServicesPage() {
  const nav = await getNavigationData();
  const services = nav?.services ?? [];

  return (
    <main className="min-h-[60vh] bg-gradient-to-b from-muted/25 to-background">
      <div className="border-b border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <MarketingBreadcrumb
            items={[{ label: "Inicio", href: "/" }, { label: "Servicios" }]}
            className={inter.className}
          />
          <div className="mt-4">
            <HomeSectionHeading
              className="max-w-none"
              align="left"
              title="Nuestros servicios"
              description="Lista completa de servicios disponibles."
              titleClassName={`${inter.className} text-[28px] font-bold tracking-[0.006em] text-foreground sm:text-[32px]`}
              descriptionClassName={`${inter.className} mt-1 w-full max-w-none text-[15px] font-normal text-muted-foreground sm:text-base`}
            />
          </div>
        </div>
      </div>
      <div className="mx-auto mt-6 max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <article
              key={s.id}
              className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm"
            >
              <h3 className="font-display text-lg font-semibold text-foreground">
                {s.name}
              </h3>
              {s.description ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {s.description}
                </p>
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
      </div>
    </main>
  );
}
