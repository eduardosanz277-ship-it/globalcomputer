import type { Metadata } from "next";
import { SearchResultsPage } from "@/components/store/SearchResultsPage";
import { resolveStorefrontPriceTier } from "@/lib/storefront-pricing";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { listAllActiveStorefrontProducts } from "@/modules/catalog/storefront-products.service";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  if (locale === "en") {
    return {
      title: "All products",
      description:
        "Full catalog: cameras, recorders, kits, and accessories available in the store.",
    };
  }
  return {
    title: "Todos los productos",
    description:
      "Catálogo completo: cámaras, grabadoras, kits y accesorios disponibles en la tienda.",
  };
}

type ProductsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstSearchParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function ProductosPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const query = firstSearchParam(resolvedSearchParams.q).trim();
  const [products, user, locale] = await Promise.all([
    listAllActiveStorefrontProducts(),
    getCurrentUserService(),
    getServerLocale(),
  ]);
  const priceTier = resolveStorefrontPriceTier(user?.role);

  return (
    <SearchResultsPage
      products={products}
      priceTier={priceTier}
      query={query}
      locale={locale}
    />
  );
}
