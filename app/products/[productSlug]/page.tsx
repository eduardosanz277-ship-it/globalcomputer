import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { LocalizedText } from "@/components/i18n/LocalizedText";
import { StorefrontProductDetailView } from "@/components/store/StorefrontProductDetailView";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { resolveStorefrontPriceTier } from "@/lib/storefront-pricing";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import {
  getStorefrontProductDetailById,
  getStorefrontProductDetailBySlug,
  type StorefrontProductDetail,
} from "@/modules/catalog/storefront-product-detail.service";
import { listSimilarStorefrontProducts } from "@/modules/catalog/storefront-similar-products.service";
import { listProductReviewsByProductId } from "@/modules/site/leave-review-data.service";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

type Props = {
  params: Promise<{ productSlug: string }> | { productSlug: string };
};

async function resolveProductBySlugParam(
  productSlug: string,
): Promise<{ product: StorefrontProductDetail | null; fromId: boolean }> {
  let product = await getStorefrontProductDetailBySlug(productSlug);
  let fromId = false;
  if (!product && UUID_RE.test(productSlug)) {
    product = await getStorefrontProductDetailById(productSlug);
    fromId = Boolean(product);
  }
  return { product, fromId };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await getServerLocale();
  const { productSlug } = await Promise.resolve(params);
  const { product } = await resolveProductBySlugParam(productSlug);
  if (!product) {
    return { title: locale === "en" ? "Product not found" : "Producto no encontrado" };
  }
  return {
    title: product.name,
    description:
      product.description?.slice(0, 155).trim() ||
      (locale === "en"
        ? `${product.name} · ${product.brand_name}. Buy at Global Computer USA.`
        : `${product.name} · ${product.brand_name}. Compra en Global Computer USA.`),
  };
}

export default async function ProductoDetallePage({ params }: Props) {
  const { productSlug } = await Promise.resolve(params);
  const { product, fromId } = await resolveProductBySlugParam(productSlug);
  if (!product) notFound();
  if (fromId || product.slug !== productSlug) {
    redirect(`/products/${product.slug}`);
  }

  const [user, productReviews, similarProducts] = await Promise.all([
    getCurrentUserService(),
    listProductReviewsByProductId(product.id),
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
              { label: <LocalizedText es="Inicio" en="Home" />, href: "/" },
              {
                label: <LocalizedText es="Productos" en="Products" />,
                href: "/products",
              },
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
