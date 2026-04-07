import type { Metadata } from "next";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { StorefrontProductCatalog } from "@/components/store/StorefrontProductCatalog";
import { resolveStorefrontPriceTier } from "@/lib/storefront-pricing";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { listAllActiveStorefrontProducts } from "@/modules/catalog/storefront-products.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Todos los productos",
  description:
    "Catálogo completo: cámaras, grabadoras, kits y accesorios disponibles en la tienda.",
};

export default async function ProductosPage() {
  const [products, user] = await Promise.all([
    listAllActiveStorefrontProducts(),
    getCurrentUserService(),
  ]);
  const priceTier = resolveStorefrontPriceTier(user?.role);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
      <MarketingBreadcrumb
        items={[{ label: "Inicio", href: "/" }, { label: "Productos" }]}
      />

      <div className="mt-6">
        <HomeSectionHeading
          title="Todos los productos"
          description="Listado de todos los artículos activos en la tienda."
          titleClassName="text-3xl sm:text-4xl"
        />
      </div>
      <div className="mt-10">
        <StorefrontProductCatalog products={products} priceTier={priceTier} />
      </div>
    </main>
  );
}
