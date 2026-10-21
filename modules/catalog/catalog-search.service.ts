import { getNavigationData } from "@/modules/navigation/navigation.service";
import { storefrontPrimaryImageUrl } from "@/modules/catalog/storefront-products.service";
import { getStorefrontProductsInOrder } from "@/modules/catalog/storefront-catalog.service";
import {
  storefrontLocalizedText,
  storefrontProductDisplayName,
} from "@/modules/catalog/storefront-product.shared";
import type { Locale } from "@/components/i18n/translations";
import { assertRemoteOk } from "@/lib/errors/rsc-network-error";
import { getCatalogSupabase, withCatalogCache } from "@/lib/supabaseCatalogClient";

export type SearchSuggestionProduct = {
  id: string;
  title: string;
  sku: string;
  brand: string;
  category: string | null;
  url: string;
  imageUrl: string | null;
  price: number;
  priceBusiness: number;
  stock: number;
  discountBusinessPct: number;
  discountClientPct: number;
};

export type SearchSuggestionLink = {
  id: string;
  title: string;
  subtitle?: string;
  url: string;
};

export type SearchSuggestions = {
  query: string;
  products: SearchSuggestionProduct[];
  brands: SearchSuggestionLink[];
  categories: SearchSuggestionLink[];
};

const PRODUCT_LIMIT = 6;
const BRAND_LIMIT = 4;
const CATEGORY_LIMIT = 5;

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function scoreSuggestion(query: string, values: Array<string | null | undefined>) {
  let best = 0;
  for (const raw of values) {
    const value = normalizeSearchText(raw ?? "");
    if (!value) continue;
    if (value === query) best = Math.max(best, 120);
    else if (value.startsWith(query)) best = Math.max(best, 90);
    else if (value.includes(query)) best = Math.max(best, 60);
  }
  return best;
}

/**
 * Productos sugeridos: la puntuación (misma que `scoreSuggestion`) y el corte a
 * `PRODUCT_LIMIT` se hacen en SQL; solo se cargan los productos devueltos.
 */
const listSuggestedProducts = withCatalogCache(
  "storefront-search-suggest",
  async (query: string, locale: Locale) => {
    const supabase = await getCatalogSupabase();
    const { data, error } = await supabase.rpc("storefront_search_suggest", {
      p_query: query,
      p_locale: locale,
      p_limit: PRODUCT_LIMIT,
    });
    if (error) assertRemoteOk(error);
    const ids = Array.isArray(data) ? (data as unknown[]).map(String) : [];
    return getStorefrontProductsInOrder(ids);
  },
);

export async function getCatalogSearchSuggestions(
  rawQuery: string,
  locale: Locale,
): Promise<SearchSuggestions> {
  const query = normalizeSearchText(rawQuery).slice(0, 80);
  if (!query) {
    return { query: "", products: [], brands: [], categories: [] };
  }

  const [products, navigation] = await Promise.all([
    listSuggestedProducts(query, locale),
    getNavigationData(),
  ]);

  const productMatches = products.map((product) => ({
    id: product.id,
    title: storefrontProductDisplayName(product, locale),
    sku: product.sku,
    brand: storefrontLocalizedText(locale, product.brand_name, product.brand_name_en),
    category: product.category_name
      ? storefrontLocalizedText(locale, product.category_name, product.category_name_en)
      : null,
    url: `/products/${product.slug}`,
    imageUrl: storefrontPrimaryImageUrl(product),
    price: product.price_client,
    priceBusiness: product.price_business,
    stock: product.stock,
    discountBusinessPct: product.discount_business_pct,
    discountClientPct: product.discount_client_pct,
  }));

  const brandMatches = navigation.brands
    .map((brand) => {
      const title = storefrontLocalizedText(locale, brand.name, brand.nameEn);
      return {
        id: brand.id,
        title,
        url: `/brands/${brand.slug}`,
        score: scoreSuggestion(query, [title, brand.name, brand.nameEn, brand.slug]),
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, BRAND_LIMIT)
    .map(({ score: _score, ...item }) => item);

  const categoryCandidates = navigation.catalogCategories.flatMap((category) => {
    const categoryTitle = storefrontLocalizedText(
      locale,
      category.name,
      category.nameEn,
    );
    return [
      {
        id: category.id,
        title: categoryTitle,
        url: `/catalog/${category.slug}`,
        score: scoreSuggestion(query, [
          categoryTitle,
          category.name,
          category.nameEn,
          category.slug,
        ]),
      },
      ...category.subcategories.map((subcategory) => {
        const title = storefrontLocalizedText(
          locale,
          subcategory.name,
          subcategory.nameEn,
        );
        return {
          id: subcategory.id,
          title,
          subtitle: categoryTitle,
          url: `/catalog/${category.slug}/${subcategory.slug}`,
          score: scoreSuggestion(query, [
            title,
            subcategory.name,
            subcategory.nameEn,
            subcategory.slug,
            categoryTitle,
          ]),
        };
      }),
    ];
  });

  const categoryMatches = categoryCandidates
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, CATEGORY_LIMIT)
    .map(({ score: _score, ...item }) => item);

  return {
    query,
    products: productMatches,
    brands: brandMatches,
    categories: categoryMatches,
  };
}
