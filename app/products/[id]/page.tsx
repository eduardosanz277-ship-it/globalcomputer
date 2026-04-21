import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { StorefrontProductDetailView } from "@/components/store/StorefrontProductDetailView";
import { resolveStorefrontPriceTier } from "@/lib/storefront-pricing";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { getStorefrontProductDetailById } from "@/modules/catalog/storefront-product-detail.service";
import { listSimilarStorefrontProducts } from "@/modules/catalog/storefront-similar-products.service";
import { listProductReviewsByProductId } from "@/modules/site/leave-review-data.service";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

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

  const product = await getStorefrontProductDetailById(id);
  if (!product) notFound();

  const [user, productReviews, similarProducts] = await Promise.all([
    getCurrentUserService(),
    listProductReviewsByProductId(id),
    listSimilarStorefrontProducts({
      productId: product.id,
      categoriaId: product.category_id,
      subcategoryId: product.subcategory_id,
      marcaId: product.brand_id,
      tipoProductoId: product.brand_type_id,
      precio: product.price,
    }),
  ]);

  const priceTier = resolveStorefrontPriceTier(user?.role);

  return (
    <main className="min-h-[60vh] bg-gradient-to-b from-muted/25 to-background">
      <div className="border-b border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <MarketingBreadcrumb
            className={inter.className}
            items={[
              { label: "Inicio", href: "/" },
              { label: "Productos", href: "/products" },
              { label: product.name },
            ]}
          />
        </div>
      </div>

      <div className="mx-auto mt-4 max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <StorefrontProductDetailView
          product={product}
          priceTier={priceTier}
          initialProductReviews={productReviews}
          similarProducts={similarProducts}
        />
      </div>
    </main>
  );
}
