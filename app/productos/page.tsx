import type { Metadata } from "next";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { StorefrontProductGrid } from "@/components/store/StorefrontProductGrid";
import { listAllActiveStorefrontProducts } from "@/modules/catalog/storefront-products.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Todos los productos",
  description:
    "Catálogo completo: cámaras, grabadoras, kits y accesorios disponibles en la tienda.",
};

export default async function ProductosPage() {
  const products = await listAllActiveStorefrontProducts();

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
        <StorefrontProductGrid products={products} />
      </div>
    </main>
  );
}
