"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
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
import type { StorefrontPriceTier } from "@/lib/storefront-pricing";
import { storefrontLocalizedText } from "@/modules/catalog/storefront-product.shared";
import {
  STOREFRONT_CATALOG_DEFAULT_PAGE_SIZE,
  STOREFRONT_CATALOG_DEFAULT_QUERY,
  STOREFRONT_CATALOG_PAGE_SIZE_OPTIONS,
  writeStorefrontCatalogQuery,
  type StorefrontCatalogPageData,
  type StorefrontCatalogQuery,
  type StorefrontCatalogSort,
  type StorefrontCatalogStockFilter,
} from "@/modules/catalog/storefront-catalog.shared";
import type { Locale } from "@/components/i18n/translations";
import { useI18n } from "@/components/i18n/I18nProvider";
import {
  adminServiceLikeInputClassName,
  adminSlideOverNestedScrollClassName,
  adminSlideOverSectionClassName,
} from "@/components/admin/admin-form-classes";
import { cn } from "@/utils/cn";
import { StorefrontProductGrid } from "./StorefrontProductGrid";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const PAGE_SIZE_OPTIONS = STOREFRONT_CATALOG_PAGE_SIZE_OPTIONS;
const DEFAULT_PAGE_SIZE = STOREFRONT_CATALOG_DEFAULT_PAGE_SIZE;
/** Espera tras teclear un precio antes de pedir la nueva p\u00e1gina al servidor. */
const PRICE_DEBOUNCE_MS = 400;

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

type StockFilterKey = StorefrontCatalogStockFilter;
type SortKey = StorefrontCatalogSort;
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

function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
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
  /** Página ya filtrada, ordenada y paginada en servidor (`loadStorefrontCatalogPage`). */
  catalog: StorefrontCatalogPageData;
  priceTier: StorefrontPriceTier;
};

export function StorefrontProductCatalog({ catalog, priceTier }: Props) {
  const {
    products,
    facets,
    filteredCount,
    query,
    locale: dataLocale,
  } = catalog;
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
  const [expandedSections, setExpandedSections] = useState<
    Record<FilterSectionKey, boolean>
  >(DEFAULT_EXPANDED_FILTER_SECTIONS);
  const pageSizeSelectId = useId();

  /**
   * La URL es la fuente de verdad; `current` refleja al instante el cambio
   * solicitado mientras el servidor devuelve la nueva página.
   */
  const [isNavigating, startNavigation] = useTransition();
  const [current, setOptimisticQuery] = useOptimistic(query);

  const navigate = useCallback(
    (next: StorefrontCatalogQuery) => {
      const qs = writeStorefrontCatalogQuery(
        next,
        new URLSearchParams(searchParams.toString()),
      ).toString();
      startNavigation(() => {
        setOptimisticQuery(next);
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams, setOptimisticQuery],
  );

  /** Cambiar cualquier filtro u orden vuelve a la primera página (como antes). */
  const updateFilters = (patch: Partial<StorefrontCatalogQuery>) => {
    navigate({ ...current, ...patch, page: 0 });
  };

  /** Texto de precio mientras se escribe; `null` = sin edición pendiente (se usa la URL). */
  const [priceDraft, setPriceDraft] = useState<{ min: string; max: string } | null>(
    null,
  );
  const priceMin = priceDraft?.min ?? current.priceMin;
  const priceMax = priceDraft?.max ?? current.priceMax;

  useEffect(() => {
    if (!priceDraft) return;
    const timer = window.setTimeout(() => {
      setPriceDraft(null);
      if (
        priceDraft.min !== current.priceMin ||
        priceDraft.max !== current.priceMax
      ) {
        navigate({
          ...current,
          priceMin: priceDraft.min,
          priceMax: priceDraft.max,
          page: 0,
        });
      }
    }, PRICE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [priceDraft, current, navigate]);

  const setPriceMin = (value: string) =>
    setPriceDraft({ min: value, max: priceMax });
  const setPriceMax = (value: string) =>
    setPriceDraft({ min: priceMin, max: value });

  /**
   * El cambio de idioma no recarga los Server Components: si la búsqueda o el orden
   * por nombre dependen del idioma, se pide de nuevo la página una sola vez.
   */
  const refreshedLocaleRef = useRef<Locale | null>(null);
  useEffect(() => {
    if (locale === dataLocale) return;
    const dependsOnLocale =
      current.q !== "" ||
      current.sort === "name_asc" ||
      current.sort === "name_desc";
    if (!dependsOnLocale || refreshedLocaleRef.current === locale) return;
    refreshedLocaleRef.current = locale;
    startNavigation(() => router.refresh());
  }, [locale, dataLocale, current.q, current.sort, router]);

  const sectionHasActiveSelection = (key: FilterSectionKey): boolean => {
    if (key === "category") return current.categoryIds.length > 0;
    if (key === "brand") return current.brandIds.length > 0;
    if (key === "price")
      return priceMin.trim() !== "" || priceMax.trim() !== "";
    if (key === "specific") return current.specificIds.length > 0;
    if (key === "stock") return current.stock.length > 0;
    return current.discountOnly;
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
    if (!panelOpen) return;
    const active = currentActiveSectionMap();
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
    current.categoryIds,
    current.brandIds,
    priceMin,
    priceMax,
    current.specificIds,
    current.stock,
    current.discountOnly,
  ]);

  const brandOptions = useMemo(() => {
    return facets.brands
      .map((b) => ({
        id: b.id,
        name: storefrontLocalizedText(locale, b.name, b.name_en),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, collatorLocale));
  }, [facets.brands, locale, collatorLocale]);

  const categoryOptions = useMemo(() => {
    const fallback = t("storefront.catalog.categoryFallback");
    return facets.categories
      .map((c) => ({
        id: c.id,
        name: storefrontLocalizedText(
          locale,
          c.name?.trim() || fallback,
          c.name_en,
        ),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, collatorLocale));
  }, [facets.categories, locale, collatorLocale, t]);

  const specificOptionsByGeneral = useMemo(() => {
    const generals = new Map<
      string,
      { id: string; name: string; specifics: Map<string, string> }
    >();
    for (const s of facets.specifics) {
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
  }, [facets.specifics, locale, collatorLocale]);

  const priceBounds = useMemo(() => {
    const range =
      priceTier === "business" ? facets.priceBusiness : facets.priceClient;
    if (range.min == null || range.max == null) return { min: 0, max: 0 };
    return { min: range.min, max: range.max };
  }, [facets.priceBusiness, facets.priceClient, priceTier]);

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

  /** Productos del listado sin filtros (antes `products.length`). */
  const totalProducts = facets.total;
  const pageSize = current.pageSize;
  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize) || 1);
  const safePageIndex = Math.min(current.page, Math.max(0, totalPages - 1));

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

  const goToPage = (pageIndex: number) => {
    navigate({ ...current, page: pageIndex });
  };

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (current.q.trim()) n += 1;
    if (current.brandIds.length > 0) n += 1;
    if (current.categoryIds.length > 0) n += 1;
    if (current.specificIds.length > 0) n += 1;
    if (priceMin.trim() || priceMax.trim()) n += 1;
    if (current.stock.length > 0) n += 1;
    if (current.discountOnly) n += 1;
    return n;
  }, [current, priceMin, priceMax]);

  const clearFilters = () => {
    setPriceDraft(null);
    navigate({ ...STOREFRONT_CATALOG_DEFAULT_QUERY, pageSize: current.pageSize });
  };

  const toggleBrand = (id: string) => {
    updateFilters({ brandIds: toggleInList(current.brandIds, id) });
  };

  const toggleCategory = (id: string) => {
    updateFilters({ categoryIds: toggleInList(current.categoryIds, id) });
  };

  const toggleSpecificCharacteristic = (id: string) => {
    updateFilters({ specificIds: toggleInList(current.specificIds, id) });
  };

  const toggleFilterSection = (key: FilterSectionKey) => {
    setExpandedSections((prev) => {
      if (prev[key] && sectionHasActiveSelection(key)) return prev;
      return { ...prev, [key]: !prev[key] };
    });
  };

  const toggleStockFilter = (key: StockFilterKey) => {
    updateFilters({ stock: toggleInList(current.stock, key) });
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
    <div className="mt-2">
      <div
        className={cn(
          "sticky z-40 -mx-4 mb-2 flex flex-col gap-3 bg-background px-4 py-3 sm:-mx-6 sm:flex-row sm:items-center sm:px-6 lg:-mx-8 lg:px-8 lg:py-4",
          "top-[var(--site-header-height)]",
        )}
      >
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
              ? `${filteredCount} ${t("storefront.catalog.countSeparator")} ${totalProducts} ${totalProducts === 1 ? t("storefront.catalog.productOne") : t("storefront.catalog.productMany")}`
              : `${totalProducts} ${totalProducts === 1 ? t("storefront.catalog.productOne") : t("storefront.catalog.productMany")}`}
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
                sortOptions.find((option) => option.value === current.sort) ??
                sortOptions[0]
              }
              onChange={(option) => {
                if (option) updateFilters({ sort: option.value });
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
                  sortOptions.find((option) => option.value === current.sort) ??
                  sortOptions[0]
                }
                onChange={(option) => {
                  if (option) updateFilters({ sort: option.value });
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
                        checked={current.categoryIds.includes(id)}
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
                    sortOptions.find((option) => option.value === current.sort) ??
                    sortOptions[0]
                  }
                  onChange={(option) => {
                    if (option) updateFilters({ sort: option.value });
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
                        checked={current.brandIds.includes(id)}
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
                              checked={current.specificIds.includes(id)}
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
                    checked={current.stock.includes("in_stock")}
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
                    checked={current.stock.includes("low")}
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
                    checked={current.stock.includes("out")}
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
                  checked={current.discountOnly}
                  onChange={(e) => updateFilters({ discountOnly: e.target.checked })}
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

      {filteredCount === 0 && totalProducts > 0 ? (
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
          <div
            aria-busy={isNavigating}
            className={cn(
              "transition-opacity",
              isNavigating && "pointer-events-none opacity-60",
            )}
          >
            <StorefrontProductGrid products={products} priceTier={priceTier} />
          </div>
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
                      menuPlacement="top"
                      onChange={(opt) => {
                        if (opt) {
                          navigate({ ...current, pageSize: opt.value, page: 0 });
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
                      onClick={() => goToPage(0)}
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
                      onClick={() => goToPage(Math.max(0, safePageIndex - 1))}
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
                        goToPage(Math.min(totalPages - 1, safePageIndex + 1))
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
                      onClick={() => goToPage(Math.max(0, totalPages - 1))}
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
