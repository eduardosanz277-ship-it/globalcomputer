"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { stockBadgeClass } from "@/lib/storefront-stock";
import {
  activeDiscountPercent,
  priceAfterDiscount,
  type StorefrontPriceTier,
} from "@/lib/storefront-pricing";
import type {
  SearchSuggestionLink,
  SearchSuggestionProduct,
  SearchSuggestions,
} from "@/modules/catalog/catalog-search.service";
import { cn } from "@/utils/cn";
import { Grid2X2, ImageOff, Loader2, Search, Tag } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

const POPULAR_SEARCHES_BY_LOCALE: Record<string, string[]> = {
  es: ["Cámara Ip", "Kits de seguridad", "Uniview"],
  en: ["Ip Camera", "Security Kits", "Uniview"],
};
const DEBOUNCE_MS = 350;

function formatUsd(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

function productSalePrice(
  product: SearchSuggestionProduct,
  priceTier: StorefrontPriceTier,
) {
  const pct = activeDiscountPercent(
    {
      discount_business_pct: product.discountBusinessPct,
      discount_client: product.discountClient,
    },
    priceTier,
  );
  return priceAfterDiscount(product.price, pct);
}

type FlatItem =
  | { kind: "product"; item: SearchSuggestionProduct }
  | { kind: "brand"; item: SearchSuggestionLink }
  | { kind: "category"; item: SearchSuggestionLink }
  | { kind: "popular"; item: string };

type Props = {
  priceTier: StorefrontPriceTier;
  className?: string;
  inputClassName?: string;
  dropdownClassName?: string;
};

function ProductMetaLine({ brand, sku }: { brand: string; sku: string }) {
  const brandRef = useRef<HTMLSpanElement>(null);
  const skuRef = useRef<HTMLSpanElement>(null);
  const [showDot, setShowDot] = useState(false);

  useLayoutEffect(() => {
    const updateSeparator = () => {
      const brandTop = brandRef.current?.offsetTop;
      const skuTop = skuRef.current?.offsetTop;
      setShowDot(brandTop != null && skuTop != null && brandTop === skuTop);
    };

    updateSeparator();
    window.addEventListener("resize", updateSeparator);
    return () => window.removeEventListener("resize", updateSeparator);
  }, [brand, sku]);

  return (
    <span className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted-foreground">
      <span ref={brandRef}>{brand}</span>
      {sku ? (
        <span ref={skuRef} className="inline-flex items-center gap-1.5">
          {showDot ? (
            <span className="text-[7px]" aria-hidden>
              •
            </span>
          ) : null}
          <span>SKU {sku}</span>
        </span>
      ) : null}
    </span>
  );
}

export function SearchAutocompleteDropdown({
  priceTier,
  className,
  inputClassName,
  dropdownClassName,
}: Props) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<SearchSuggestions>({
    query: "",
    products: [],
    brands: [],
    categories: [],
  });

  const trimmedQuery = query.trim();
  const showPopular = trimmedQuery.length === 0;
  const popularSearches = useMemo(
    () => POPULAR_SEARCHES_BY_LOCALE[locale] ?? POPULAR_SEARCHES_BY_LOCALE.es,
    [locale],
  );
  const hasResults =
    suggestions.products.length > 0 ||
    suggestions.brands.length > 0 ||
    suggestions.categories.length > 0;

  const flatItems = useMemo<FlatItem[]>(() => {
    if (showPopular) {
      return popularSearches.map((item) => ({ kind: "popular", item }));
    }
    return [
      ...suggestions.products.map((item) => ({
        kind: "product" as const,
        item,
      })),
      ...suggestions.brands.map((item) => ({ kind: "brand" as const, item })),
      ...suggestions.categories.map((item) => ({
        kind: "category" as const,
        item,
      })),
    ];
  }, [showPopular, suggestions, popularSearches]);

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
    setIsOpen(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!isOpen || showPopular) {
      abortRef.current?.abort();
      setIsLoading(false);
      setSuggestions({ query: "", products: [], brands: [], categories: [] });
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: trimmedQuery,
          locale,
        });
        const response = await fetch(`/api/search/suggest?${params}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Search suggestions failed");
        const data = (await response.json()) as SearchSuggestions;
        setSuggestions(data);
        setActiveIndex(-1);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("No se pudieron cargar las sugerencias", error);
        setSuggestions({
          query: trimmedQuery,
          products: [],
          brands: [],
          categories: [],
        });
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, locale, showPopular, trimmedQuery]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const goToSearch = (value = trimmedQuery) => {
    const q = value.trim();
    if (!q) return;
    setIsOpen(false);
    router.push(`/products?q=${encodeURIComponent(q)}`);
  };

  const goToItem = (item: FlatItem) => {
    if (item.kind === "popular") {
      goToSearch(item.item);
      return;
    }
    setIsOpen(false);
    router.push(item.item.url);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) =>
        flatItems.length === 0
          ? -1
          : Math.min(current + 1, flatItems.length - 1),
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        flatItems.length === 0 ? -1 : Math.max(current - 1, 0),
      );
      return;
    }
    if (event.key === "Enter") {
      if (activeIndex >= 0 && flatItems[activeIndex]) {
        event.preventDefault();
        goToItem(flatItems[activeIndex]);
      }
      return;
    }
    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const renderProduct = (product: SearchSuggestionProduct, index: number) => {
    const img = product.imageUrl;
    const sale = productSalePrice(product, priceTier);
    const stockUi = stockBadgeClass(product.stock, locale);
    const inStockUi = stockBadgeClass(6, locale);
    const stockLabel = product.stock > 0 ? "In stock" : "Out of stock";
    return (
      <button
        type="button"
        key={product.id}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => goToItem({ kind: "product", item: product })}
        className={cn(
          "flex w-full gap-3 rounded-2xl border border-transparent p-2.5 text-left transition hover:border-primary/20 hover:bg-primary/[0.04]",
          activeIndex === index && "border-primary/30 bg-primary/[0.06]",
        )}
      >
        <span className="relative flex h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
          {img ? (
            <Image
              src={img}
              alt={product.title}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageOff className="h-6 w-6" aria-hidden />
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {product.title}
          </span>
          <ProductMetaLine brand={product.brand} sku={product.sku} />
          <span className="mt-1 flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-primary">
              {formatUsd(sale)}
            </span>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                product.stock > 0
                  ? inStockUi.cardLabelClassName
                  : stockUi.cardLabelClassName,
              )}
            >
              {stockLabel}
            </span>
          </span>
        </span>
      </button>
    );
  };

  const renderLink = (
    item: SearchSuggestionLink,
    kind: "brand" | "category",
    index: number,
  ) => {
    const Icon = kind === "brand" ? Tag : Grid2X2;
    return (
      <button
        type="button"
        key={`${kind}-${item.id}`}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => goToItem({ kind, item })}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-muted",
          activeIndex === index && "bg-primary/[0.06] text-primary",
        )}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium">{item.title}</span>
          {item.subtitle ? (
            <span className="block truncate text-xs text-muted-foreground">
              {item.subtitle}
            </span>
          ) : null}
        </span>
      </button>
    );
  };

  let runningIndex = 0;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          goToSearch();
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          {t("header.searchLabel")}
        </label>
        <Search
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground sm:right-3.5"
          aria-hidden
        />
        <input
          id={inputId}
          type="search"
          name="q"
          value={query}
          placeholder={t("header.searchPlaceholder")}
          autoComplete="off"
          className={inputClassName}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          aria-expanded={isOpen}
          aria-controls={`${inputId}-suggestions`}
          aria-autocomplete="list"
        />
      </form>

      {isOpen ? (
        <div
          id={`${inputId}-suggestions`}
          role="listbox"
          className={cn(
            "absolute left-0 right-0 top-full z-[140] mt-2 max-h-[min(75vh,620px)] overflow-y-auto overscroll-contain rounded-xl border border-border/70 bg-popover p-3 text-popover-foreground shadow-2xl shadow-black/15",
            dropdownClassName,
          )}
        >
          {showPopular ? (
            <div>
              <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t("header.search.popularTitle")}
              </p>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term, index) => (
                  <button
                    type="button"
                    key={term}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => goToSearch(term)}
                    className={cn(
                      "rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/30 hover:bg-primary/[0.06] hover:text-primary",
                      activeIndex === index &&
                        "border-primary/40 bg-primary/[0.08]",
                    )}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {t("header.search.loading")}
            </div>
          ) : hasResults ? (
            <div className="space-y-4">
              {suggestions.products.length > 0 ? (
                <section>
                  <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {t("header.search.productsTitle")}
                  </p>
                  <div className="space-y-1.5">
                    {suggestions.products.map((product) => {
                      const index = runningIndex;
                      runningIndex += 1;
                      return (
                        <Fragment key={product.id}>
                          {renderProduct(product, index)}
                        </Fragment>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {suggestions.brands.length > 0 ? (
                <section>
                  <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {t("header.search.brandsTitle")}
                  </p>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {suggestions.brands.map((brand) => {
                      const index = runningIndex;
                      runningIndex += 1;
                      return renderLink(brand, "brand", index);
                    })}
                  </div>
                </section>
              ) : null}

              {suggestions.categories.length > 0 ? (
                <section>
                  <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {t("header.search.categoriesTitle")}
                  </p>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {suggestions.categories.map((category) => {
                      const index = runningIndex;
                      runningIndex += 1;
                      return renderLink(category, "category", index);
                    })}
                  </div>
                </section>
              ) : null}

              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => goToSearch()}
                className="mt-1 flex w-full items-center justify-center rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                {t("header.search.viewAll").replace("{query}", trimmedQuery)}
              </button>
            </div>
          ) : (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-semibold text-foreground">
                {t("header.search.emptyTitle")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("header.search.emptyDescription")}
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
