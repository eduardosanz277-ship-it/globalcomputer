import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { getNavigationData } from "@/modules/navigation/navigation.service";
import Link from "next/link";

export default async function BrandsPage() {
  const nav = await getNavigationData();
  const brands = nav?.brands ?? [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <HomeSectionHeading
        eyebrow="Tienda"
        title="Comprar por marca"
        description="Explora productos organizados por marca."
      />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {brands.map((b) => (
          <Link
            key={b.id}
            href={`/brands/${b.id}`}
            className="group flex flex-col items-start gap-3 rounded-2xl border border-border/50 bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-soft-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {b.name.slice(0, 1)}
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              {b.name}
            </h3>
            <span className="text-sm text-muted-foreground">Ver productos</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
