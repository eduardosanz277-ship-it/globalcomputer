import { Inter } from "next/font/google";
import { LocalizedText } from "@/components/i18n/LocalizedText";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { StorefrontBrandsHubDocumentTitle } from "@/components/store/StorefrontBrandsHubDocumentTitle";
import { StorefrontLocalizedName } from "@/components/store/StorefrontLocalizedName";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { getNavigationData } from "@/modules/navigation/navigation.service";
import type { Metadata } from "next";
import Link from "next/link";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  if (locale === "en") {
    return {
      title: "Shop by brand",
      description: "Browse products by brand.",
    };
  }
  return {
    title: "Comprar por marca",
    description: "Explora productos organizados por marca.",
  };
}

export default async function BrandsPage() {
  const nav = await getNavigationData();
  const brands = nav?.brands ?? [];

  return (
    <main className="min-h-[60vh] bg-gradient-to-b from-muted/25 to-background">
      <StorefrontBrandsHubDocumentTitle />
      <div className="border-b border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <MarketingBreadcrumb
            className={inter.className}
            items={[
              { label: <LocalizedText es="Inicio" en="Home" />, href: "/" },
              {
                label: (
                  <LocalizedText es="Comprar por marca" en="Shop by brand" />
                ),
              },
            ]}
          />
          <HomeSectionHeading
            eyebrow={<LocalizedText es="Tienda" en="Store" />}
            align="left"
            title={
              <LocalizedText es="Comprar por marca" en="Shop by brand" />
            }
            titleClassName={`${inter.className} text-[28px] font-bold tracking-[0.006em] text-foreground sm:text-[32px]`}
          />
        </div>
      </div>
      <div className="mx-auto mt-6 max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {brands.map((b) => (
            <Link
              key={b.id}
              href={`/brands/${b.slug}`}
              className="group flex flex-col items-start gap-3 rounded-2xl border border-border/50 bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-soft-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                {b.name.slice(0, 1)}
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                <StorefrontLocalizedName name={b.name} nameEn={b.nameEn ?? null} />
              </h3>
              <span className="text-sm text-muted-foreground">
                <LocalizedText es="Ver productos" en="View products" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
