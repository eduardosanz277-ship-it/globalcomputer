import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { getNavigationData } from "@/modules/navigation/navigation.service";
import Link from "next/link";

export default async function SecuritySystemPage() {
  const nav = await getNavigationData();
  const generals = nav?.characteristicsGeneral ?? [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <HomeSectionHeading
        eyebrow="Security"
        title="Security System"
        description="Explora por característica general y luego por valor específico, como en Shop by brand."
      />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {generals.map((g) => (
          <Link
            key={g.id}
            href={`/security-system/${g.id}`}
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
    </main>
  );
}
