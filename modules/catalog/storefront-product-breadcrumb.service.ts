import type { MarketingBreadcrumbItem } from "@/components/marketing/MarketingBreadcrumb";
import { LocalizedText } from "@/components/i18n/LocalizedText";
import { StorefrontLocalizedName } from "@/components/store/StorefrontLocalizedName";
import { isStorefrontListingPath } from "@/lib/storefront-product-nav";
import {
  getStorefrontCategoryById,
  getStorefrontSubcategoryById,
} from "@/modules/catalog/storefront-categories.service";
import type { StorefrontProductDetail } from "@/modules/catalog/storefront-product-detail.service";
import { createElement, type ReactNode } from "react";

type NamedCrumb = {
  name: string;
  nameEn: string | null;
  href?: string;
};

type FixedCrumb = {
  es: string;
  en: string;
  href?: string;
};

function fixedLabel(es: string, en: string): ReactNode {
  return createElement(LocalizedText, { es, en });
}

function namedLabel(name: string, nameEn: string | null): ReactNode {
  return createElement(StorefrontLocalizedName, { name, nameEn });
}

function toItems(
  crumbs: Array<FixedCrumb | NamedCrumb>,
): MarketingBreadcrumbItem[] {
  return crumbs.map((c) => {
    if ("es" in c) {
      return { label: fixedLabel(c.es, c.en), href: c.href };
    }
    return {
      label: namedLabel(c.name, c.nameEn),
      href: c.href,
    };
  });
}

const catalogCrumb = (): FixedCrumb => ({
  es: "Catálogo",
  en: "Catalog",
  href: "/products",
});

async function crumbsFromProductTaxonomy(
  product: StorefrontProductDetail,
): Promise<Array<FixedCrumb | NamedCrumb>> {
  const crumbs: Array<FixedCrumb | NamedCrumb> = [catalogCrumb()];

  let category: Awaited<ReturnType<typeof getStorefrontCategoryById>> = null;
  let subcategory: Awaited<ReturnType<typeof getStorefrontSubcategoryById>> =
    null;

  if (product.subcategory_id) {
    subcategory = await getStorefrontSubcategoryById(product.subcategory_id);
  }

  const categoryId = product.category_id ?? subcategory?.categoryId ?? null;
  if (categoryId) {
    category = await getStorefrontCategoryById(categoryId);
  }

  if (category) {
    crumbs.push({
      name: category.name,
      nameEn: category.nameEn,
      href: `/catalog/${category.slug}`,
    });
  }

  if (subcategory && category) {
    crumbs.push({
      name: subcategory.name,
      nameEn: subcategory.nameEn,
      href: `/catalog/${category.slug}/${subcategory.slug}`,
    });
  }

  return crumbs;
}

/**
 * Listado más específico de la taxonomía del producto:
 * subcategoría si existe, si no categoría, si no catálogo general.
 */
export async function resolveProductTaxonomyListingPath(
  product: StorefrontProductDetail,
): Promise<string> {
  const crumbs = await crumbsFromProductTaxonomy(product);
  for (let i = crumbs.length - 1; i >= 0; i -= 1) {
    const href = crumbs[i].href;
    if (href && isStorefrontListingPath(href) && href !== "/products") {
      return href;
    }
  }
  return "/products";
}

/**
 * Migas del detalle: categoría/subcategoría reales del producto,
 * no el listado desde el que se buscó o se navegó.
 * El último tramo (nombre del producto) lo añade la página.
 */
export async function resolveProductDetailBreadcrumbPrefix(
  product: StorefrontProductDetail,
): Promise<MarketingBreadcrumbItem[]> {
  return toItems(await crumbsFromProductTaxonomy(product));
}
