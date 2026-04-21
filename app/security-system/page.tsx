import { Inter } from "next/font/google";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { getNavigationData } from "@/modules/navigation/navigation.service";
import Link from "next/link";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default async function SecuritySystemPage() {
  const nav = await getNavigationData();
  const generals = nav?.characteristicsGeneral ?? [];

  return (
    <main className="min-h-[60vh] bg-gradient-to-b from-muted/25 to-background">
      <div className="border-b border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* description="Elige una categoría para ver todos sus productos, o entra en un valor concreto desde el menú para filtrar." */}
          {/* descriptionClassName={`${inter.className} mt-1 max-w-[700px] text-[15px] font-normal text-muted-foreground sm:text-base`} */}
          <HomeSectionHeading
            eyebrow="Security"
            align="left"
            title="Security System"
            titleClassName={`${inter.className} text-[28px] font-bold tracking-[0.006em] text-foreground sm:text-[32px]`}
          />
        </div>
      </div>
          <div className="mx-auto mt-6 max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {generals.map((g) => (
            <Link
              key={g.id}
              href={`/security-system/${g.slug}`}
              className="group flex flex-col items-start gap-3 rounded-2xl border border-border/50 bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-soft-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                {g.name.slice(0, 1)}
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                {g.name}
              </h3>
              <span className="text-sm text-muted-foreground">
                {g.specifics.length} opciones
              </span>
              <span className="text-sm font-semibold text-primary">Explorar</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
