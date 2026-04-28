"use client";

import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  FilterX,
} from "lucide-react";
import Select from "react-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  appSelectStyles,
  appToolbarSelectStyles,
} from "@/components/ui/react-select-app-styles";
import { SlideOver, SlideOverFooter } from "@/components/ui/slide-over";
import {
  activeDiscountPercent,
  priceAfterDiscount,
  type StorefrontPriceTier,
} from "@/lib/storefront-pricing";
import type { StorefrontProduct } from "@/modules/catalog/storefront-product.shared";
import {
  storefrontLocalizedText,
  storefrontProductDisplayName,
} from "@/modules/catalog/storefront-product.shared";
import { useI18n } from "@/components/i18n/I18nProvider";
import {
  adminServiceLikeInputClassName,
  adminSlideOverNestedScrollClassName,
  adminSlideOverSectionClassName,
} from "@/components/admin/admin-form-classes";
import { cn } from "@/utils/cn";
import { StorefrontProductGrid } from "./StorefrontProductGrid";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = 20;

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** react-select dentro del SlideOver: menú por encima del área scroll (mismo criterio que `FormSelectField` con portal). */
const catalogSlideOverSelectStyles: typeof appSelectStyles = {
  ...appSelectStyles,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  menu: (base: any, state: any) => {
    const base2 =
      typeof appSelectStyles.menu === "function"
        ? appSelectStyles.menu(base, state)
        : base;
    return { ...base2, zIndex: 9999 };
  },
};

type PageSizeOption = { value: number; label: string };

type StockFilterKey = "in_stock" | "low" | "out";
type SortKey =
  | "relevance"
  | "price_asc"
  | "price_desc"
  | "name_asc"
  | "name_desc"
  | "date_desc"
  | "date_asc";
type SortOption = { value: SortKey; label: string };
type FilterSectionKey =
  | "category"
  | "brand"
  | "price"
  | "specific"
  | "stock"
  | "offers";

const DEFAULT_EXPANDED_FILTER_SECTIONS: Record<FilterSectionKey, boolean> = {
  category: true,
  brand: true,
  price: true,
  specific: false,
  stock: false,
  offers: false,
};

const EMPTY_FILTER_SECTIONS_STATE: Record<FilterSectionKey, boolean> = {
  category: false,
  brand: false,
  price: false,
  specific: false,
  stock: false,
  offers: false,
};

function salePrice(p: StorefrontProduct, tier: StorefrontPriceTier): number {
  const pct = activeDiscountPercent(p, tier);
  return priceAfterDiscount(p.price, pct);
}

function hasDiscount(p: StorefrontProduct, tier: StorefrontPriceTier): boolean {
  const pct = activeDiscountPercent(p, tier);
  return pct > 0 && priceAfterDiscount(p.price, pct) < p.price;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function FilterPanelSection({
  className,
  title,
  description,
  isOpen,
  onToggle,
  children,
}: {
  className?: string;
  title: string;
  description?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className={className}>
      <button
        type="button"
        className="w-full text-left"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="block min-w-0">
          <span className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold tracking-wide text-foreground">
              {title}
            </span>
            <span
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-xl font-medium leading-none text-muted-foreground"
              aria-hidden
            >
              {isOpen ? "−" : "+"}
            </span>
          </span>
          {description ? (
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
              {description}
            </span>
          ) : null}
        </span>
      </button>
      {isOpen ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}

type Props = {
  products: StorefrontProduct[];
  priceTier: StorefrontPriceTier;
  initialSearch?: string;
};

export function StorefrontProductCatalog({
  products,
  priceTier,
  initialSearch = "",
}: Props) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const collatorLocale = locale === "en" ? "en" : "es";

  const sortOptions = useMemo<SortOption[]>(
    () => [
      { value: "relevance", label: t("storefront.catalog.sortRelevance") },
      { value: "name_asc", label: t("storefront.catalog.sortNameAsc") },
      { value: "name_desc", label: t("storefront.catalog.sortNameDesc") },
      { value: "price_asc", label: t("storefront.catalog.sortPriceAsc") },
      { value: "price_desc", label: t("storefront.catalog.sortPriceDesc") },
      { value: "date_desc", label: t("storefront.catalog.sortDateDesc") },
      { value: "date_asc", label: t("storefront.catalog.sortDateAsc") },
    ],
    [t],
  );

  const sortSelectWidthCh =
    sortOptions.reduce((max, option) => Math.max(max, option.label.length), 0) +
    8;

  const [panelOpen, setPanelOpen] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [brandIds, setBrandIds] = useState<Record<string, boolean>>({});
  const [categoryIds, setCategoryIds] = useState<Record<string, boolean>>({});
  const [specificIds, setSpecificIds] = useState<Record<string, boolean>>({});
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [stockFilters, setStockFilters] = useState<
    Partial<Record<StockFilterKey, boolean>>
  >({});
  const [discountOnly, setDiscountOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("relevance");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [expandedSections, setExpandedSections] = useState<
    Record<FilterSectionKey, boolean>
  >(DEFAULT_EXPANDED_FILTER_SECTIONS);
  const [stickyOpenSections, setStickyOpenSections] = useState<
    Record<FilterSectionKey, boolean>
  >(EMPTY_FILTER_SECTIONS_STATE);
  const pageSizeSelectId = useId();

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  const sectionHasActiveSelection = (key: FilterSectionKey): boolean => {
    if (key === "category") return Object.values(categoryIds).some(Boolean);
    if (key === "brand") return Object.values(brandIds).some(Boolean);
    if (key === "price")
      return priceMin.trim() !== "" || priceMax.trim() !== "";
    if (key === "specific") return Object.values(specificIds).some(Boolean);
    if (key === "stock") return Object.values(stockFilters).some(Boolean);
    return discountOnly;
  };

  const currentActiveSectionMap = (): Record<FilterSectionKey, boolean> => ({
    category: sectionHasActiveSelection("category"),
    brand: sectionHasActiveSelection("brand"),
    price: sectionHasActiveSelection("price"),
    specific: sectionHasActiveSelection("specific"),
    stock: sectionHasActiveSelection("stock"),
    offers: sectionHasActiveSelection("offers"),
  });

  useEffect(() => {
    if (!panelOpen) {
      setStickyOpenSections(EMPTY_FILTER_SECTIONS_STATE);
      return;
    }
    const active = currentActiveSectionMap();
    setExpandedSections({
      ...DEFAULT_EXPANDED_FILTER_SECTIONS,
      category: DEFAULT_EXPANDED_FILTER_SECTIONS.category || active.category,
      brand: DEFAULT_EXPANDED_FILTER_SECTIONS.brand || active.brand,
      price: DEFAULT_EXPANDED_FILTER_SECTIONS.price || active.price,
      specific: DEFAULT_EXPANDED_FILTER_SECTIONS.specific || active.specific,
      stock: DEFAULT_EXPANDED_FILTER_SECTIONS.stock || active.stock,
      offers: DEFAULT_EXPANDED_FILTER_SECTIONS.offers || active.offers,
    });
    setStickyOpenSections(active);
  }, [panelOpen]);

  useEffect(() => {
    if (!panelOpen) return;
    const active = currentActiveSectionMap();
    setStickyOpenSections((prev) => ({
      category: prev.category || active.category,
      brand: prev.brand || active.brand,
      price: prev.price || active.price,
      specific: prev.specific || active.specific,
      stock: prev.stock || active.stock,
      offers: prev.offers || active.offers,
    }));
    setExpandedSections((prev) => ({
      category: prev.category || active.category,
      brand: prev.brand || active.brand,
      price: prev.price || active.price,
      specific: prev.specific || active.specific,
      stock: prev.stock || active.stock,
      offers: prev.offers || active.offers,
    }));
  }, [
    panelOpen,
    categoryIds,
    brandIds,
    priceMin,
    priceMax,
    specificIds,
    stockFilters,
    discountOnly,
  ]);

  const brandOptions = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of products) {
      if (!m.has(p.brand_id)) {
        m.set(
          p.brand_id,
          storefrontLocalizedText(locale, p.brand_name, p.brand_name_en),
        );
      }
    }
    return Array.from(m.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, collatorLocale));
  }, [products, locale, collatorLocale]);

  const categoryOptions = useMemo(() => {
    const m = new Map<string, string>();
    const fallback = t("storefront.catalog.categoryFallback");
    for (const p of products) {
      if (p.category_id == null) continue;
      const label = storefrontLocalizedText(
        locale,
        p.category_name?.trim() || fallback,
        p.category_name_en,
      );
      if (!m.has(p.category_id)) m.set(p.category_id, label);
    }
    return Array.from(m.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, collatorLocale));
  }, [products, locale, collatorLocale, t]);

  const specificOptionsByGeneral = useMemo(() => {
    const generals = new Map<
      string,
      { id: string; name: string; specifics: Map<string, string> }
    >();
    for (const p of products) {
      for (const s of p.characteristic_specifics) {
        if (!generals.has(s.general_id)) {
          generals.set(s.general_id, {
            id: s.general_id,
            name: storefrontLocalizedText(
              locale,
              s.general_name,
              s.general_name_en,
            ),
            specifics: new Map(),
          });
        }
        const g = generals.get(s.general_id)!;
        if (!g.specifics.has(s.id)) {
          g.specifics.set(
            s.id,
            storefrontLocalizedText(locale, s.name, s.name_en),
          );
        }
      }
    }
    return Array.from(generals.values())
      .map((g) => ({
        generalId: g.id,
        generalName: g.name,
        specifics: Array.from(g.specifics.entries())
          .map(([id, name]) => ({ id, name }))
          .sort((a, b) => a.name.localeCompare(b.name, collatorLocale)),
      }))
      .filter((g) => g.specifics.length > 0)
      .sort((a, b) =>
        a.generalName.localeCompare(b.generalName, collatorLocale),
      );
  }, [products, locale, collatorLocale]);

  const priceBounds = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const p of products) {
      const s = salePrice(p, priceTier);
      if (s < min) min = s;
      if (s > max) max = s;
    }
    if (!Number.isFinite(min) || !Number.isFinite(max))
      return { min: 0, max: 0 };
    return { min, max };
  }, [products, priceTier]);

  const sliderMinBound = Math.floor(priceBounds.min);
  const sliderMaxBound = Math.ceil(priceBounds.max);
  const hasPriceRange = sliderMaxBound > sliderMinBound;

  const inputMinValue = priceMin.trim() === "" ? Number.NaN : Number(priceMin);
  const inputMaxValue = priceMax.trim() === "" ? Number.NaN : Number(priceMax);
  const resolvedMin = Number.isFinite(inputMinValue)
    ? clamp(Math.round(inputMinValue), sliderMinBound, sliderMaxBound)
    : sliderMinBound;
  const resolvedMax = Number.isFinite(inputMaxValue)
    ? clamp(Math.round(inputMaxValue), sliderMinBound, sliderMaxBound)
    : sliderMaxBound;
  const sliderMinValue = Math.min(resolvedMin, resolvedMax);
  const sliderMaxValue = Math.max(resolvedMin, resolvedMax);
  const sliderSpan = Math.max(1, sliderMaxBound - sliderMinBound);
  const sliderStartPercent =
    ((sliderMinValue - sliderMinBound) / sliderSpan) * 100;
  const sliderEndPercent =
    ((sliderMaxValue - sliderMinBound) / sliderSpan) * 100;

  const filtered = useMemo(() => {
    const q = normalizeSearchText(search);
    const selectedBrands = Object.entries(brandIds)
      .filter(([, v]) => v)
      .map(([id]) => id);
    const hasBrandFilter = selectedBrands.length > 0;

    const selectedCategories = Object.entries(categoryIds)
      .filter(([, v]) => v)
      .map(([id]) => id);
    const hasCategoryFilter = selectedCategories.length > 0;

    const selectedSpecificIds = Object.entries(specificIds)
      .filter(([, v]) => v)
      .map(([id]) => id);
    const hasSpecificFilter = selectedSpecificIds.length > 0;

    const minN = priceMin.trim() === "" ? null : Number(priceMin);
    const maxN = priceMax.trim() === "" ? null : Number(priceMax);
    const minOk = minN !== null && Number.isFinite(minN);
    const maxOk = maxN !== null && Number.isFinite(maxN);

    const selectedStockFilters = (
      Object.keys(stockFilters) as StockFilterKey[]
    ).filter((key) => Boolean(stockFilters[key]));
    const hasStockFilter = selectedStockFilters.length > 0;

    let list = products.filter((p) => {
      if (q) {
        const productHaystack = normalizeSearchText(
          [
          storefrontProductDisplayName(p, locale),
          p.name,
          p.name_en,
          p.sku,
          p.slug,
          storefrontLocalizedText(locale, p.brand_name, p.brand_name_en),
          p.brand_name,
          p.brand_name_en,
          p.category_name
            ? storefrontLocalizedText(locale, p.category_name, p.category_name_en)
            : null,
          p.category_name,
          p.category_name_en,
          ...p.characteristic_specifics.flatMap((s) => [
            storefrontLocalizedText(locale, s.name, s.name_en),
            s.name,
            s.name_en,
            storefrontLocalizedText(locale, s.general_name, s.general_name_en),
            s.general_name,
            s.general_name_en,
            s.value,
          ]),
        ]
          .filter(Boolean)
          .join(" "),
        );
        if (!productHaystack.includes(q)) return false;
      }
      if (hasBrandFilter && !selectedBrands.includes(p.brand_id)) return false;

      if (hasCategoryFilter) {
        if (
          p.category_id == null ||
          !selectedCategories.includes(p.category_id)
        ) {
          return false;
        }
      }

      if (hasSpecificFilter) {
        const productSpecificIds = new Set(
          p.characteristic_specifics.map((s) => s.id),
        );
        if (!selectedSpecificIds.some((id) => productSpecificIds.has(id))) {
          return false;
        }
      }

      const sale = salePrice(p, priceTier);
      if (minOk && sale < minN) return false;
      if (maxOk && sale > maxN) return false;

      if (discountOnly && !hasDiscount(p, priceTier)) return false;

      if (hasStockFilter) {
        const matchesInStock = p.stock > 0;
        const matchesLow = p.stock > 0 && p.stock <= 5;
        const matchesOut = p.stock === 0;
        const matchesSelected = selectedStockFilters.some((key) => {
          if (key === "in_stock") return matchesInStock;
          if (key === "low") return matchesLow;
          return matchesOut;
        });
        if (!matchesSelected) return false;
      }

      return true;
    });

    const sorted = [...list];
    switch (sortBy) {
      case "price_asc":
        sorted.sort(
          (a, b) => salePrice(a, priceTier) - salePrice(b, priceTier),
        );
        break;
      case "price_desc":
        sorted.sort(
          (a, b) => salePrice(b, priceTier) - salePrice(a, priceTier),
        );
        break;
      case "name_asc":
        sorted.sort((a, b) =>
          storefrontProductDisplayName(a, locale).localeCompare(
            storefrontProductDisplayName(b, locale),
            collatorLocale,
          ),
        );
        break;
      case "name_desc":
        sorted.sort((a, b) =>
          storefrontProductDisplayName(b, locale).localeCompare(
            storefrontProductDisplayName(a, locale),
            collatorLocale,
          ),
        );
        break;
      case "date_desc":
        sorted.sort((a, b) => {
          const ta = new Date(a.updated_at).getTime();
          const tb = new Date(b.updated_at).getTime();
          return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
        });
        break;
      case "date_asc":
        sorted.sort((a, b) => {
          const ta = new Date(a.updated_at).getTime();
          const tb = new Date(b.updated_at).getTime();
          return (Number.isNaN(ta) ? 0 : ta) - (Number.isNaN(tb) ? 0 : tb);
        });
        break;
      default:
        break;
    }
    return sorted;
  }, [
    products,
    priceTier,
    search,
    brandIds,
    categoryIds,
    specificIds,
    priceMin,
    priceMax,
    stockFilters,
    discountOnly,
    sortBy,
    locale,
    collatorLocale,
  ]);

  const filterResetKey = useMemo(
    () =>
      `${search}|${priceMin}|${priceMax}|${discountOnly}|${sortBy}|${JSON.stringify(brandIds)}|${JSON.stringify(categoryIds)}|${JSON.stringify(specificIds)}|${JSON.stringify(stockFilters)}`,
    [
      search,
      priceMin,
      priceMax,
      discountOnly,
      sortBy,
      brandIds,
      categoryIds,
      specificIds,
      stockFilters,
    ],
  );

  useEffect(() => {
    setPageIndex(0);
  }, [filterResetKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);

  useEffect(() => {
    setPageIndex((i) => Math.min(i, Math.max(0, totalPages - 1)));
  }, [filtered.length, pageSize, totalPages]);

  const safePageIndex = Math.min(pageIndex, Math.max(0, totalPages - 1));
  const paginatedProducts = useMemo(() => {
    const start = safePageIndex * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePageIndex, pageSize]);

  const filteredCount = filtered.length;
  const startRow = filteredCount === 0 ? 0 : safePageIndex * pageSize + 1;
  const endRow = Math.min((safePageIndex + 1) * pageSize, filteredCount);

  const mergedPageSizeOptions = useMemo(
    () =>
      [...new Set([...PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE])].sort(
        (a, b) => a - b,
      ),
    [],
  );

  const pageSizeSelectOptions = useMemo<PageSizeOption[]>(
    () =>
      mergedPageSizeOptions.map((size) => ({
        value: size,
        label: String(size),
      })),
    [mergedPageSizeOptions],
  );

  const pageSizeValue =
    pageSizeSelectOptions.find((o) => o.value === pageSize) ??
    pageSizeSelectOptions[0] ??
    null;

  const canPrev = safePageIndex > 0;
  const canNext = safePageIndex < totalPages - 1;

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (search.trim()) n += 1;
    if (Object.values(brandIds).some(Boolean)) n += 1;
    if (Object.values(categoryIds).some(Boolean)) n += 1;
    if (Object.values(specificIds).some(Boolean)) n += 1;
    if (priceMin.trim() || priceMax.trim()) n += 1;
    if (Object.values(stockFilters).some(Boolean)) n += 1;
    if (discountOnly) n += 1;
    return n;
  }, [
    search,
    brandIds,
    categoryIds,
    specificIds,
    priceMin,
    priceMax,
    stockFilters,
    discountOnly,
  ]);

  const clearFilters = () => {
    setSearch("");
    setBrandIds({});
    setCategoryIds({});
    setSpecificIds({});
    setPriceMin("");
    setPriceMax("");
    setStockFilters({});
    setDiscountOnly(false);
    setSortBy("relevance");
    if (searchParams.has("q")) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("q");
      const nextQuery = params.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    }
  };

  const toggleBrand = (id: string) => {
    setBrandIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCategory = (id: string) => {
    setCategoryIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSpecificCharacteristic = (id: string) => {
    setSpecificIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleFilterSection = (key: FilterSectionKey) => {
    setExpandedSections((prev) => {
      if (prev[key] && (sectionHasActiveSelection(key) || stickyOpenSections[key]))
        return prev;
      return { ...prev, [key]: !prev[key] };
    });
  };

  const toggleStockFilter = (key: StockFilterKey) => {
    setStockFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleMinSliderChange = (next: number) => {
    const bounded = clamp(next, sliderMinBound, sliderMaxValue);
    setPriceMin(String(bounded));
  };

  const handleMaxSliderChange = (next: number) => {
    const bounded = clamp(next, sliderMinValue, sliderMaxBound);
    setPriceMax(String(bounded));
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className={cn(
            "flex flex-wrap items-center",
            activeFilterCount > 0 ? "gap-1 sm:gap-3" : "gap-3",
          )}
        >
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="outline"
              className="h-11 gap-2 rounded-xl border-border/80 bg-card px-4 text-sm font-semibold shadow-sm transition hover:bg-muted/50"
              onClick={() => setPanelOpen(true)}
              aria-expanded={panelOpen}
              aria-controls="storefront-filters-panel"
            >
              <Filter
                className="h-4 w-4 shrink-0"
                strokeWidth={2}
                aria-hidden
              />
              {activeFilterCount === 0
                ? t("storefront.catalog.filterIdle")
                : activeFilterCount === 1
                  ? t("storefront.catalog.filterWithCount").replace(
                      "{count}",
                      String(activeFilterCount),
                    )
                  : t("storefront.catalog.filtersWithCount").replace(
                      "{count}",
                      String(activeFilterCount),
                    )}
            </Button>
            {activeFilterCount > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl border-border/80 bg-card shadow-sm transition hover:bg-muted/50"
                onClick={clearFilters}
                title={t("storefront.catalog.clearFilters")}
                aria-label={t("storefront.catalog.clearFilters")}
              >
                <FilterX className="h-4 w-4" aria-hidden />
              </Button>
            ) : null}
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {activeFilterCount > 0
              ? `${filtered.length} ${t("storefront.catalog.countSeparator")} ${products.length} ${products.length === 1 ? t("storefront.catalog.productOne") : t("storefront.catalog.productMany")}`
              : `${products.length} ${products.length === 1 ? t("storefront.catalog.productOne") : t("storefront.catalog.productMany")}`}
          </p>
        </div>

        <div className="hidden w-full items-center gap-2 sm:ml-auto sm:flex sm:w-auto">
          <Label
            htmlFor="toolbar-sort"
            className="whitespace-nowrap text-sm font-medium"
          >
            {t("storefront.catalog.sortBy")}
          </Label>
          <div
            className="min-w-0 flex-1 sm:flex-none"
            style={{ width: `${sortSelectWidthCh}ch` }}
          >
            <Select<SortOption, false>
              instanceId="toolbar-sort"
              inputId="toolbar-sort"
              styles={appSelectStyles}
              options={sortOptions}
              value={
                sortOptions.find((option) => option.value === sortBy) ??
                sortOptions[0]
              }
              onChange={(option) => {
                if (option) setSortBy(option.value);
              }}
              isClearable={false}
              isSearchable={false}
              noOptionsMessage={() => t("storefront.catalog.noOptions")}
            />
          </div>
        </div>
      </div>

      <SlideOver
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={t("storefront.catalog.slideOverTitle")}
        description={t("storefront.catalog.slideOverDescription")}
        side="left"
        contentAriaLabel={t("storefront.catalog.slideOverContentAria")}
        footer={
          <SlideOverFooter className="justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                clearFilters();
              }}
            >
              {t("storefront.catalog.clear")}
            </Button>
            <Button type="button" onClick={() => setPanelOpen(false)}>
              {t("storefront.catalog.viewResults")}
            </Button>
          </SlideOverFooter>
        }
      >
        <div id="storefront-filters-panel" className="space-y-5">
          <section
            className={cn(
              adminSlideOverSectionClassName,
              "sm:hidden",
              /* Separa de Precio en móvil; Precio usa !mt-0 y no recibe el gap del panel */
              "mb-5",
            )}
            aria-label={t("storefront.catalog.sortSectionAria")}
          >
            <header className="space-y-1">
              <h2 className="text-sm font-semibold tracking-wide text-foreground">
                {t("storefront.catalog.sortSectionTitle")}
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("storefront.catalog.sortSectionDescription")}
              </p>
            </header>
            <div className="mt-4 space-y-2">
              <Label
                htmlFor="filter-sort-mobile"
                className="text-sm font-medium"
              >
                {t("storefront.catalog.criterion")}
              </Label>
              <Select<SortOption, false>
                instanceId="filter-sort-mobile"
                inputId="filter-sort-mobile"
                menuPosition="fixed"
                styles={catalogSlideOverSelectStyles}
                options={sortOptions}
                value={
                  sortOptions.find((option) => option.value === sortBy) ??
                  sortOptions[0]
                }
                onChange={(option) => {
                  if (option) setSortBy(option.value);
                }}
                isClearable={false}
                isSearchable={false}
                noOptionsMessage={() => t("storefront.catalog.noOptions")}
                className="w-full"
              />
            </div>
          </section>

          {categoryOptions.length > 0 ? (
            <FilterPanelSection
              className={cn(adminSlideOverSectionClassName, "!mt-0")}
              title={t("storefront.catalog.category")}
              description={t("storefront.catalog.categoryDescription")}
              isOpen={expandedSections.category}
              onToggle={() => toggleFilterSection("category")}
            >
              <div className={adminSlideOverNestedScrollClassName}>
                {categoryOptions.map(({ id, name }) => (
                  <div
                    key={id}
                    className="rounded-lg border border-border/60 p-3"
                  >
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={Boolean(categoryIds[id])}
                        onChange={() => toggleCategory(id)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium leading-snug text-foreground">
                        {name}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </FilterPanelSection>
          ) : null}

          {/* <section className={adminSlideOverSectionClassName}>
            <header className="space-y-1">
              <h2 className="text-sm font-semibold tracking-wide text-foreground">
                Búsqueda y orden
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Filtra por texto y elige cómo ordenar los resultados.
              </p>
            </header>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filter-search" className="text-sm font-medium">
                  Buscar
                </Label>
                <Input
                  id="filter-search"
                  placeholder="Nombre o marca…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoComplete="off"
                  className={adminServiceLikeInputClassName}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-sort" className="text-sm font-medium">
                  Ordenar por
                </Label>
                <Select<SortOption, false>
                  instanceId="filter-sort"
                  inputId="filter-sort"
                  styles={appSelectStyles}
                  options={sortOptions}
                  value={
                    sortOptions.find((option) => option.value === sortBy) ??
                    sortOptions[0]
                  }
                  onChange={(option) => {
                    if (option) setSortBy(option.value);
                  }}
                  isClearable={false}
                  isSearchable={false}
                />
              </div>
            </div>
          </section> */}

          {brandOptions.length > 0 ? (
            <FilterPanelSection
              className={adminSlideOverSectionClassName}
              title={t("storefront.catalog.brand")}
              description={t("storefront.catalog.brandDescription")}
              isOpen={expandedSections.brand}
              onToggle={() => toggleFilterSection("brand")}
            >
              <div className={adminSlideOverNestedScrollClassName}>
                {brandOptions.map(({ id, name }) => (
                  <div
                    key={id}
                    className="rounded-lg border border-border/60 p-3"
                  >
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={Boolean(brandIds[id])}
                        onChange={() => toggleBrand(id)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium leading-snug text-foreground">
                        {name}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </FilterPanelSection>
          ) : null}

          <FilterPanelSection
            className={adminSlideOverSectionClassName}
            title={t("storefront.catalog.price")}
            description={t("storefront.catalog.priceDescription")}
            isOpen={expandedSections.price}
            onToggle={() => toggleFilterSection("price")}
          >
            <div className="space-y-2">
              <div className="rounded-xl border border-border/60 bg-card/60 px-4 py-4 shadow-sm">
                <div className="relative h-6">
                  <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-muted" />
                  <div
                    className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary/85"
                    style={{
                      left: `${sliderStartPercent}%`,
                      right: `${100 - sliderEndPercent}%`,
                    }}
                  />
                  <input
                    type="range"
                    min={sliderMinBound}
                    max={sliderMaxBound}
                    step={1}
                    value={sliderMinValue}
                    disabled={!hasPriceRange}
                    onChange={(e) =>
                      handleMinSliderChange(Number(e.target.value))
                    }
                    className="pointer-events-none absolute inset-0 h-6 w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:mt-[-5px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary/30 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-primary/30 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md disabled:opacity-50"
                    aria-label={t("storefront.catalog.priceMinSliderAria")}
                  />
                  <input
                    type="range"
                    min={sliderMinBound}
                    max={sliderMaxBound}
                    step={1}
                    value={sliderMaxValue}
                    disabled={!hasPriceRange}
                    onChange={(e) =>
                      handleMaxSliderChange(Number(e.target.value))
                    }
                    className="pointer-events-none absolute inset-0 h-6 w-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:mt-[-5px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary/30 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-primary/30 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md disabled:opacity-50"
                    aria-label={t("storefront.catalog.priceMaxSliderAria")}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {t("storefront.catalog.priceFrom").replace(
                      "{value}",
                      String(sliderMinBound),
                    )}
                  </span>
                  <span>
                    {t("storefront.catalog.priceTo").replace(
                      "{value}",
                      String(sliderMaxBound),
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="filter-price-min"
                  className="text-sm font-medium"
                >
                  {t("storefront.catalog.priceMinLabel")}
                </Label>
                <Input
                  id="filter-price-min"
                  inputMode="decimal"
                  placeholder={
                    priceBounds.min ? String(Math.floor(priceBounds.min)) : "0"
                  }
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className={adminServiceLikeInputClassName}
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="filter-price-max"
                  className="text-sm font-medium"
                >
                  {t("storefront.catalog.priceMaxLabel")}
                </Label>
                <Input
                  id="filter-price-max"
                  inputMode="decimal"
                  placeholder={
                    priceBounds.max
                      ? String(Math.ceil(priceBounds.max))
                      : t("storefront.catalog.pricePlaceholderDash")
                  }
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className={adminServiceLikeInputClassName}
                />
              </div>
            </div>
          </FilterPanelSection>

          {specificOptionsByGeneral.length > 0 ? (
            <FilterPanelSection
              className={adminSlideOverSectionClassName}
              title={t("storefront.catalog.specificTitle")}
              description={t("storefront.catalog.specificDescription")}
              isOpen={expandedSections.specific}
              onToggle={() => toggleFilterSection("specific")}
            >
              <div className="space-y-5">
                {specificOptionsByGeneral.map((group) => (
                  <div key={group.generalId} className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {group.generalName}
                    </h3>
                    <div className={adminSlideOverNestedScrollClassName}>
                      {group.specifics.map(({ id, name }) => (
                        <div
                          key={id}
                          className="rounded-lg border border-border/60 p-3"
                        >
                          <label className="flex cursor-pointer items-start gap-3">
                            <input
                              type="checkbox"
                              checked={Boolean(specificIds[id])}
                              onChange={() => toggleSpecificCharacteristic(id)}
                              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
                            />
                            <span className="text-sm font-medium leading-snug text-foreground">
                              {name}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </FilterPanelSection>
          ) : null}

          <FilterPanelSection
            className={adminSlideOverSectionClassName}
            title={t("storefront.catalog.availability")}
            description={t("storefront.catalog.availabilityDescription")}
            isOpen={expandedSections.stock}
            onToggle={() => toggleFilterSection("stock")}
          >
            <div className="space-y-2">
              <div className="rounded-lg border border-border/60 p-3">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={Boolean(stockFilters.in_stock)}
                    onChange={() => toggleStockFilter("in_stock")}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="block text-sm font-medium text-foreground">
                    {t("storefront.catalog.stockInStock")}
                  </span>
                </label>
              </div>
              <div className="rounded-lg border border-border/60 p-3">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={Boolean(stockFilters.low)}
                    onChange={() => toggleStockFilter("low")}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="block text-sm font-medium text-foreground">
                    {t("storefront.catalog.stockLow")}
                  </span>
                </label>
              </div>
              <div className="rounded-lg border border-border/60 p-3">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={Boolean(stockFilters.out)}
                    onChange={() => toggleStockFilter("out")}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="block text-sm font-medium text-foreground">
                    {t("storefront.catalog.stockOut")}
                  </span>
                </label>
              </div>
            </div>
          </FilterPanelSection>

          <FilterPanelSection
            className={adminSlideOverSectionClassName}
            title={t("storefront.catalog.offers")}
            description={t("storefront.catalog.offersDescription")}
            isOpen={expandedSections.offers}
            onToggle={() => toggleFilterSection("offers")}
          >
            <div className="rounded-lg border border-border/60 p-3">
              <label
                htmlFor="filter-discount"
                className="flex cursor-pointer items-start gap-3"
              >
                <input
                  id="filter-discount"
                  type="checkbox"
                  checked={discountOnly}
                  onChange={(e) => setDiscountOnly(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">
                    {t("storefront.catalog.discountOnly")}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {t("storefront.catalog.discountOnlyHint")}
                  </span>
                </span>
              </label>
            </div>
          </FilterPanelSection>
        </div>
      </SlideOver>

      {filtered.length === 0 && products.length > 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 bg-muted/70 px-6 py-12 text-center text-sm text-muted-foreground">
          {t("storefront.catalog.emptyFiltered")}{" "}
          <button
            type="button"
            onClick={clearFilters}
            className="font-semibold text-black underline underline-offset-2 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
          >
            {t("storefront.catalog.emptyFilteredClear")}
          </button>
        </p>
      ) : (
        <>
          <StorefrontProductGrid
            products={paginatedProducts}
            priceTier={priceTier}
          />
          {filteredCount > 0 ? (
            <nav
              className={cn("mt-8 border-t border-border/80 pt-4")}
              aria-label={t("storefront.catalog.paginationNavAria")}
            >
              <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between xl:gap-6">
                <p
                  role="status"
                  className="min-w-0 text-sm leading-relaxed text-muted-foreground"
                >
                  {filteredCount === 0 ? (
                    t("storefront.catalog.noProducts")
                  ) : (
                    <>
                      {t("storefront.catalog.showing")}{" "}
                      <span className="tabular-nums font-medium text-foreground">
                        {startRow}–{endRow}
                      </span>{" "}
                      {t("storefront.catalog.rangeTo")}{" "}
                      <span className="tabular-nums font-medium text-foreground">
                        {filteredCount}
                      </span>{" "}
                      {filteredCount === 1
                        ? t("storefront.catalog.productOne")
                        : t("storefront.catalog.productMany")}
                      <span className="mx-1.5 text-muted-foreground/70">·</span>
                      {t("storefront.catalog.pageWord")}{" "}
                      <span className="tabular-nums font-medium text-foreground">
                        {safePageIndex + 1}
                      </span>{" "}
                      {t("storefront.catalog.pageOf")}{" "}
                      <span className="tabular-nums font-medium text-foreground">
                        {totalPages}
                      </span>
                    </>
                  )}
                </p>

                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-x-6 sm:gap-y-3 xl:shrink-0">
                  <div
                    className="flex min-w-0 flex-wrap items-center gap-2 sm:flex-nowrap"
                    role="group"
                    aria-labelledby={`${pageSizeSelectId}-label`}
                  >
                    <label
                      id={`${pageSizeSelectId}-label`}
                      htmlFor={`${pageSizeSelectId}-input`}
                      className="max-w-full text-sm leading-snug text-muted-foreground sm:whitespace-nowrap"
                    >
                      {t("storefront.catalog.productsPerPage")}
                    </label>
                    <Select<PageSizeOption, false>
                      instanceId={pageSizeSelectId}
                      inputId={`${pageSizeSelectId}-input`}
                      aria-labelledby={`${pageSizeSelectId}-label`}
                      isSearchable={false}
                      isClearable={false}
                      options={pageSizeSelectOptions}
                      value={pageSizeValue}
                      onChange={(opt) => {
                        if (opt) {
                          setPageSize(opt.value);
                          setPageIndex(0);
                        }
                      }}
                      styles={appToolbarSelectStyles}
                      className="min-w-[62px] shrink-0"
                    />
                  </div>

                  <div
                    className="flex items-center gap-1"
                    role="group"
                    aria-label={t("storefront.catalog.paginationGroupAria")}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="min-h-9 min-w-9 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => setPageIndex(0)}
                      disabled={!canPrev}
                      aria-label={t("storefront.catalog.firstPageAria")}
                      title={t("storefront.catalog.firstPageTitle")}
                    >
                      <ChevronsLeft className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="min-h-9 min-w-9 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                      disabled={!canPrev}
                      aria-label={t("storefront.catalog.prevPageAria")}
                      title={t("storefront.catalog.prevPageTitle")}
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="min-h-9 min-w-9 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        setPageIndex((i) => Math.min(totalPages - 1, i + 1))
                      }
                      disabled={!canNext}
                      aria-label={t("storefront.catalog.nextPageAria")}
                      title={t("storefront.catalog.nextPageTitle")}
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="min-h-9 min-w-9 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => setPageIndex(Math.max(0, totalPages - 1))}
                      disabled={!canNext}
                      aria-label={t("storefront.catalog.lastPageAria")}
                      title={t("storefront.catalog.lastPageTitle")}
                    >
                      <ChevronsRight className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </div>
              </div>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
