import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { StorefrontProductDetailView } from "@/components/store/StorefrontProductDetailView";
import { resolveStorefrontPriceTier } from "@/lib/storefront-pricing";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { getStorefrontProductDetailById } from "@/modules/catalog/storefront-product-detail.service";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{ id: string }> | { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await Promise.resolve(params);
  if (!UUID_RE.test(id)) return { title: "Producto" };
  const product = await getStorefrontProductDetailById(id);
  if (!product) return { title: "Producto no encontrado" };
  return {
    title: product.name,
    description:
      product.description?.slice(0, 155).trim() ||
      `${product.name} · ${product.brand_name}. Compra en Global Computer USA.`,
  };
}

export default async function ProductoDetallePage({ params }: Props) {
  const { id } = await Promise.resolve(params);
  if (!UUID_RE.test(id)) notFound();

  const [product, user] = await Promise.all([
    getStorefrontProductDetailById(id),
    getCurrentUserService(),
  ]);
  if (!product) notFound();

  const priceTier = resolveStorefrontPriceTier(user?.role);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
      <MarketingBreadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Productos", href: "/productos" },
          { label: product.name },
        ]}
      />
      <StorefrontProductDetailView product={product} priceTier={priceTier} />
    </main>
  );
}
