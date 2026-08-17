import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { LocalizedText } from "@/components/i18n/LocalizedText";
import { StorefrontLocalizedName } from "@/components/store/StorefrontLocalizedName";
import { StorefrontProductBackLink } from "@/components/store/StorefrontProductBackLink";
import { StorefrontProductDetailView } from "@/components/store/StorefrontProductDetailView";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { plainTextFromHtml, resolveLocalizedRichHtml } from "@/lib/plainTextFromHtml";
import { normalizeStorefrontFromPath } from "@/lib/storefront-product-nav";
import { resolveStorefrontPriceTier } from "@/lib/storefront-pricing";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { resolveProductDetailBreadcrumbPrefix } from "@/modules/catalog/storefront-product-breadcrumb.service";
import {
  getStorefrontProductDetailById,
  getStorefrontProductDetailBySlug,
  type StorefrontProductDetail,
} from "@/modules/catalog/storefront-product-detail.service";
import {
  storefrontLocalizedText,
  storefrontProductDisplayName,
} from "@/modules/catalog/storefront-product.shared";
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
  searchParams?:
    | Promise<{ from?: string | string[] }>
    | { from?: string | string[] };
};

function firstSearchParam(
  value: string | string[] | undefined,
): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

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
    return {
      title: locale === "en" ? "Product not found" : "Producto no encontrado",
    };
  }
  const displayName = storefrontProductDisplayName(product, locale);
  const brandName = storefrontLocalizedText(
    locale,
    product.brand_name,
    product.brand_name_en,
  );
  const descriptionText = plainTextFromHtml(
    resolveLocalizedRichHtml(
      locale,
      product.description,
      product.description_en,
    ),
  );
  return {
    title: displayName,
    description:
      descriptionText.slice(0, 155).trim() ||
      (locale === "en"
        ? `${displayName} · ${brandName}. Buy at Global Computer USA.`
        : `${displayName} · ${brandName}. Compra en Global Computer USA.`),
  };
}

export default async function ProductoDetallePage({
  params,
  searchParams,
}: Props) {
  const { productSlug } = await Promise.resolve(params);
  const resolvedSearch = searchParams
    ? await Promise.resolve(searchParams)
    : {};
  const fromParam = normalizeStorefrontFromPath(
    firstSearchParam(resolvedSearch.from),
  );

  const { product, fromId } = await resolveProductBySlugParam(productSlug);
  if (!product) notFound();
  if (fromId || product.slug !== productSlug) {
    const qs = fromParam
      ? `?from=${encodeURIComponent(fromParam)}`
      : "";
    redirect(`/products/${product.slug}${qs}`);
  }

  const [user, productReviews, similarProducts, breadcrumbPrefix] =
    await Promise.all([
      getCurrentUserService(),
      listProductReviewsByProductId(product.id),
      listSimilarStorefrontProducts({
        productId: product.id,
        categoriaId: product.category_id,
        subcategoryId: product.subcategory_id,
        marcaId: product.brand_id,
        tipoProductoId: product.brand_type_id,
        precio: product.price_client,
      }),
      resolveProductDetailBreadcrumbPrefix(product, fromParam),
    ]);

  const priceTier = resolveStorefrontPriceTier(user?.role);

  return (
    <main className="min-h-[60vh] bg-gradient-to-b from-muted/25 to-background">
      <div className="border-b border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3">
            <StorefrontProductBackLink
              className={inter.className}
              fromPath={fromParam}
            />
            <MarketingBreadcrumb
              className={inter.className}
              items={[
                { label: <LocalizedText es="Inicio" en="Home" />, href: "/" },
                ...breadcrumbPrefix,
                {
                  label: (
                    <StorefrontLocalizedName
                      name={product.name}
                      nameEn={product.name_en}
                    />
                  ),
                },
              ]}
            />
          </div>
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
