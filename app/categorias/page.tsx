import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { getStorefrontCategoriesWithSubcategories } from "@/modules/catalog/storefront-categories.service";

export const metadata: Metadata = {
  title: "Categorías",
  description:
    "Explora las categorías y subcategorías de productos de Global Computers USA.",
};

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default async function CategoriasPage() {
  const categories = await getStorefrontCategoriesWithSubcategories();

  return (
    <main className="min-h-[60vh] bg-gradient-to-b from-muted/25 to-background">
      <div className="border-b border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <MarketingBreadcrumb
            items={[{ label: "Inicio", href: "/" }, { label: "Categorías" }]}
            className={inter.className}
          />
          <div className="mt-4">
            <HomeSectionHeading
              className="max-w-none"
              align="left"
              title="Categorías"
              description="Cada categoría incluye sus subcategorías cuando existen."
              titleClassName={`${inter.className} text-[28px] font-bold tracking-[0.006em] text-foreground sm:text-[32px]`}
              descriptionClassName={`${inter.className} mt-1 w-full max-w-none text-[15px] font-normal text-muted-foreground sm:text-base`}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        {categories.length === 0 ? (
          <p className={`${inter.className} text-muted-foreground`}>
            No hay categorías disponibles por el momento.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <article
                key={cat.id}
                className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm"
              >
                <h2 className="font-display text-lg font-semibold text-foreground">
                  <Link
                    href={`/catalogo/${cat.id}`}
                    className="transition hover:text-primary"
                  >
                    {cat.name}
                  </Link>
                </h2>
                {cat.subcategories.length > 0 ? (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {cat.subcategories.map((sub) => (
                      <li key={sub.id}>
                        <Link
                          href={`/catalogo/${cat.id}/${sub.id}`}
                          className={`inline-flex rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-sm text-foreground transition hover:border-primary/40 hover:bg-primary/5 ${inter.className}`}
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p
                    className={`${inter.className} mt-3 text-sm text-muted-foreground`}
                  >
                    Sin subcategorías.
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
