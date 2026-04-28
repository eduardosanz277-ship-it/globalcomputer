import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/components/i18n/translations";
import { getCatalogSearchSuggestions } from "@/modules/catalog/catalog-search.service";
import type { Locale } from "@/components/i18n/translations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseLocale(value: string | null): Locale {
  if (value && SUPPORTED_LOCALES.includes(value as Locale)) {
    return value as Locale;
  }
  return DEFAULT_LOCALE;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const locale = parseLocale(searchParams.get("locale"));

  try {
    const suggestions = await getCatalogSearchSuggestions(q, locale);
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("[search/suggest] failed", error);
    return NextResponse.json(
      { query: q, products: [], brands: [], categories: [] },
      { status: 200 },
    );
  }
}
