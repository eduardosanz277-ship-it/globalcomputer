import type { MarketingBreadcrumbItem } from "@/components/marketing/MarketingBreadcrumb";
import { LocalizedText } from "@/components/i18n/LocalizedText";
import { StorefrontLocalizedName } from "@/components/store/StorefrontLocalizedName";
import {
  isStorefrontListingPath,
  normalizeStorefrontFromPath,
} from "@/lib/storefront-product-nav";
import {
  getStorefrontCategoryById,
  getStorefrontCategoryBySlug,
  getStorefrontSubcategoryById,
  getStorefrontSubcategoryInCategoryBySlug,
} from "@/modules/catalog/storefront-categories.service";
import {
  getBrandBySlug,
  getBrandTypeBySlug,
} from "@/modules/catalog/storefront-products.service";
import {
  getCharacteristicGeneralBySlugOrId,
  getCharacteristicSpecificBySlugOrId,
} from "@/modules/catalog/storefront-security.service";
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

async function crumbsFromListingPath(
  fromPath: string,
): Promise<Array<FixedCrumb | NamedCrumb> | null> {
  const path = normalizeStorefrontFromPath(fromPath);
  if (!path || !isStorefrontListingPath(path)) return null;

  if (path === "/products") {
    return [catalogCrumb()];
  }

  if (path === "/products/featured") {
    return [
      catalogCrumb(),
      { es: "Destacados", en: "Featured", href: "/products/featured" },
    ];
  }

  if (path.startsWith("/catalog/")) {
    const parts = path.slice("/catalog/".length).split("/").filter(Boolean);
    if (parts.length === 0 || parts.length > 2) return null;
    const category = await getStorefrontCategoryBySlug(parts[0]!);
    if (!category) return null;
    const crumbs: Array<FixedCrumb | NamedCrumb> = [
      catalogCrumb(),
      {
        name: category.name,
        nameEn: category.nameEn,
        href: `/catalog/${category.slug}`,
      },
    ];
    if (parts.length === 2) {
      const subcategory = await getStorefrontSubcategoryInCategoryBySlug(
        category.id,
        parts[1]!,
      );
      if (!subcategory) return null;
      crumbs.push({
        name: subcategory.name,
        nameEn: subcategory.nameEn,
        href: `/catalog/${category.slug}/${subcategory.slug}`,
      });
    }
    return crumbs;
  }

  if (path.startsWith("/brands/")) {
    const parts = path.slice("/brands/".length).split("/").filter(Boolean);
    if (parts.length === 0 || parts.length > 2) return null;
    const brand = await getBrandBySlug(parts[0]!);
    if (!brand) return null;
    const crumbs: Array<FixedCrumb | NamedCrumb> = [
      catalogCrumb(),
      {
        name: brand.name,
        nameEn: brand.nameEn,
        href: `/brands/${brand.slug}`,
      },
    ];
    if (parts.length === 2) {
      const brandType = await getBrandTypeBySlug(brand.id, parts[1]!);
      if (!brandType) return null;
      crumbs.push({
        name: brandType.name,
        nameEn: brandType.nameEn,
        href: `/brands/${brand.slug}/${brandType.slug}`,
      });
    }
    return crumbs;
  }

  if (path === "/security-system") {
    return [
      {
        es: "Sistemas de Seguridad",
        en: "Security Systems",
        href: "/security-system",
      },
    ];
  }

  if (path.startsWith("/security-system/")) {
    const parts = path
      .slice("/security-system/".length)
      .split("/")
      .filter(Boolean);
    if (parts.length === 0 || parts.length > 2) return null;
    const resolvedGeneral = await getCharacteristicGeneralBySlugOrId(parts[0]!);
    if (!resolvedGeneral) return null;
    const { general } = resolvedGeneral;
    const crumbs: Array<FixedCrumb | NamedCrumb> = [
      catalogCrumb(),
      {
        name: general.name,
        nameEn: general.nameEn,
        href: `/security-system/${general.slug}`,
      },
    ];
    if (parts.length === 2) {
      const resolvedSpecific = await getCharacteristicSpecificBySlugOrId(
        general.id,
        parts[1]!,
      );
      if (!resolvedSpecific) return null;
      const { specific } = resolvedSpecific;
      crumbs.push({
        name: specific.name,
        nameEn: specific.nameEn,
        href: `/security-system/${general.slug}/${specific.slug}`,
      });
    }
    return crumbs;
  }

  return null;
}

/**
 * Migas del detalle de producto: conserva el listado de origen (`?from=`)
 * o, si no hay / no es válido, la taxonomía del producto.
 * El último tramo (nombre del producto) lo añade la página.
 */
export async function resolveProductDetailBreadcrumbPrefix(
  product: StorefrontProductDetail,
  fromRaw: string | null | undefined,
): Promise<MarketingBreadcrumbItem[]> {
  const fromPath = normalizeStorefrontFromPath(fromRaw);
  if (fromPath) {
    const fromCrumbs = await crumbsFromListingPath(fromPath);
    if (fromCrumbs) return toItems(fromCrumbs);
  }
  return toItems(await crumbsFromProductTaxonomy(product));
}
