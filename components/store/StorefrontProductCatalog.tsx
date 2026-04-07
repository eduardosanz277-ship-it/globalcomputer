"use client";

import { useEffect, useId, useMemo, useState } from "react";
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
  adminServiceLikeInputClassName,
  adminSlideOverNestedScrollClassName,
  adminSlideOverSectionClassName,
} from "@/components/admin/admin-form-classes";
import { cn } from "@/utils/cn";
import { StorefrontProductGrid } from "./StorefrontProductGrid";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = 20;

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

const sortOptions: SortOption[] = [
  { value: "relevance", label: "Destacados" },
  { value: "name_asc", label: "Nombre (A–Z)" },
  { value: "name_desc", label: "Nombre (Z–A)" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "date_desc", label: "Más recientes" },
  { value: "date_asc", label: "Más antiguos" },
];

const SORT_SELECT_WIDTH_CH =
  sortOptions.reduce((max, option) => Math.max(max, option.label.length), 0) +
  8;

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

type Props = {
  products: StorefrontProduct[];
  priceTier: StorefrontPriceTier;
};

export function StorefrontProductCatalog({ products, priceTier }: Props) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [brandIds, setBrandIds] = useState<Record<string, boolean>>({});
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [stockFilters, setStockFilters] = useState<
    Partial<Record<StockFilterKey, boolean>>
  >({});
  const [discountOnly, setDiscountOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("relevance");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const pageSizeSelectId = useId();

  const brandOptions = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of products) {
      if (!m.has(p.brand_id)) m.set(p.brand_id, p.brand_name);
    }
    return Array.from(m.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [products]);

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
    const q = search.trim().toLowerCase();
    const selectedBrands = Object.entries(brandIds)
      .filter(([, v]) => v)
      .map(([id]) => id);
    const hasBrandFilter = selectedBrands.length > 0;

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
        const inName = p.name.toLowerCase().includes(q);
        const inBrand = p.brand_name.toLowerCase().includes(q);
        if (!inName && !inBrand) return false;
      }
      if (hasBrandFilter && !selectedBrands.includes(p.brand_id)) return false;

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
        sorted.sort((a, b) => a.name.localeCompare(b.name, "es"));
        break;
      case "name_desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name, "es"));
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
    priceMin,
    priceMax,
    stockFilters,
    discountOnly,
    sortBy,
  ]);

  const filterResetKey = useMemo(
    () =>
      `${search}|${priceMin}|${priceMax}|${discountOnly}|${sortBy}|${JSON.stringify(brandIds)}|${JSON.stringify(stockFilters)}`,
    [search, priceMin, priceMax, discountOnly, sortBy, brandIds, stockFilters],
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
    if (priceMin.trim() || priceMax.trim()) n += 1;
    if (Object.values(stockFilters).some(Boolean)) n += 1;
    if (discountOnly) n += 1;
    return n;
  }, [search, brandIds, priceMin, priceMax, stockFilters, discountOnly]);

  const clearFilters = () => {
    setSearch("");
    setBrandIds({});
    setPriceMin("");
    setPriceMax("");
    setStockFilters({});
    setDiscountOnly(false);
    setSortBy("relevance");
  };

  const toggleBrand = (id: string) => {
    setBrandIds((prev) => ({ ...prev, [id]: !prev[id] }));
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
            activeFilterCount > 0 ? "gap-1 sm:gap-3" : "gap-3"
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
              <Filter className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              {activeFilterCount > 0
                ? `Filtros (${activeFilterCount})`
                : "Filtro"}
            </Button>
            {activeFilterCount > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl border-border/80 bg-card shadow-sm transition hover:bg-muted/50"
                onClick={clearFilters}
                title="Limpiar filtros"
                aria-label="Limpiar filtros"
              >
                <FilterX className="h-4 w-4" aria-hidden />
              </Button>
            ) : null}
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {activeFilterCount > 0
              ? `${filtered.length} de ${products.length} productos`
              : `${products.length} productos`}
          </p>
        </div>

        <div className="hidden w-full items-center gap-2 sm:ml-auto sm:flex sm:w-auto">
          <Label
            htmlFor="toolbar-sort"
            className="whitespace-nowrap text-sm font-medium"
          >
            Ordenar por:
          </Label>
          <div
            className="min-w-0 flex-1 sm:flex-none"
            style={{ width: `${SORT_SELECT_WIDTH_CH}ch` }}
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
            />
          </div>
        </div>
      </div>

      <SlideOver
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title="Filtros"
        description="Refina el catálogo por marca, precio, disponibilidad y ofertas."
        side="left"
        contentAriaLabel="Opciones de filtrado del catálogo"
        footer={
          <SlideOverFooter className="justify-between gap-3 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => {
                clearFilters();
              }}
            >
              Limpiar
            </Button>
            <Button type="button" onClick={() => setPanelOpen(false)}>
              Ver resultados
            </Button>
          </SlideOverFooter>
        }
      >
        <div id="storefront-filters-panel" className="space-y-5">
          <section
            className={cn(adminSlideOverSectionClassName, "sm:hidden")}
            aria-label="Ordenar catálogo"
          >
            <header className="space-y-1">
              <h2 className="text-sm font-semibold tracking-wide text-foreground">
                Ordenar por
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Elige cómo ordenar los productos del listado.
              </p>
            </header>
            <div className="mt-4 space-y-2">
              <Label
                htmlFor="filter-sort-mobile"
                className="text-sm font-medium"
              >
                Criterio
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
                noOptionsMessage={() => "Sin coincidencias"}
                className="w-full"
              />
            </div>
          </section>

          <section className={adminSlideOverSectionClassName}>
            <header className="space-y-1">
              <h2 className="text-sm font-semibold tracking-wide text-foreground">
                Precio
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Rango según tu precio de venta (USD, con descuento de perfil).
              </p>
            </header>
            <div className="mt-4 space-y-2">
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
                    aria-label="Precio mínimo del rango"
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
                    aria-label="Precio máximo del rango"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Desde {sliderMinBound}</span>
                  <span>Hasta {sliderMaxBound}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="filter-price-min"
                  className="text-sm font-medium"
                >
                  Precio mínimo
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
                  Precio máximo
                </Label>
                <Input
                  id="filter-price-max"
                  inputMode="decimal"
                  placeholder={
                    priceBounds.max ? String(Math.ceil(priceBounds.max)) : "—"
                  }
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className={adminServiceLikeInputClassName}
                />
              </div>
            </div>
          </section>

          <section className={adminSlideOverSectionClassName}>
            <header className="space-y-1">
              <h2 className="text-sm font-semibold tracking-wide text-foreground">
                Disponibilidad
              </h2>
            </header>
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
                    En stock
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
                    Poco stock (1-5 uds.)
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
                    Agotado
                  </span>
                </label>
              </div>
            </div>
          </section>

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
            <section className={adminSlideOverSectionClassName}>
              <header className="space-y-1">
                <h2 className="text-sm font-semibold tracking-wide text-foreground">
                  Marca
                </h2>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Marca una o varias marcas para acotar el listado.
                </p>
              </header>
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
            </section>
          ) : null}

          <section className={adminSlideOverSectionClassName}>
            <header className="space-y-1">
              <h2 className="text-sm font-semibold tracking-wide text-foreground">
                Ofertas
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Solo productos con descuento aplicable a tu perfil.
              </p>
            </header>
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
                    Solo en oferta
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Incluye descuentos según tu perfil (cliente o empresa).
                  </span>
                </span>
              </label>
            </div>
          </section>
        </div>
      </SlideOver>

      {filtered.length === 0 && products.length > 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 bg-muted/35 px-6 py-12 text-center text-sm text-muted-foreground">
          Ningún producto coincide con los filtros. Ajusta los criterios para
          ver más resultados.
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
              aria-label="Paginación del catálogo"
            >
              <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between xl:gap-6">
                <p
                  role="status"
                  className="min-w-0 text-sm leading-relaxed text-muted-foreground"
                >
                  {filteredCount === 0 ? (
                    "Sin productos."
                  ) : (
                    <>
                      Mostrando{" "}
                      <span className="tabular-nums font-medium text-foreground">
                        {startRow}–{endRow}
                      </span>{" "}
                      de{" "}
                      <span className="tabular-nums font-medium text-foreground">
                        {filteredCount}
                      </span>
                      {filteredCount === 1 ? " producto" : " productos"}
                      <span className="mx-1.5 text-muted-foreground/70">·</span>
                      página{" "}
                      <span className="tabular-nums font-medium text-foreground">
                        {safePageIndex + 1}
                      </span>{" "}
                      de{" "}
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
                      Productos por página
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
                    aria-label="Ir a otra página de productos"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="min-h-9 min-w-9 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => setPageIndex(0)}
                      disabled={!canPrev}
                      aria-label="Ir a la primera página"
                      title="Primera página"
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
                      aria-label="Página anterior"
                      title="Anterior"
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
                      aria-label="Página siguiente"
                      title="Siguiente"
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
                      aria-label="Ir a la última página"
                      title="Última página"
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
