"use client";

import { useCallback, useMemo, useState, type CSSProperties } from "react";
import type { BrandType } from "@/modules/admin/brand-types/brand-types.types";
import type { Brand } from "@/modules/admin/brands/brands.types";
import type {
  AdminCategory,
  AdminSubcategory,
} from "@/modules/admin/categories/categories.types";
import type { Product } from "@/modules/admin/products/products.types";
import type { SpecificCharacteristic } from "@/modules/admin/specific-characteristics/specific-characteristics.types";
import type { ColumnDef, Row } from "@tanstack/react-table";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { swalSaasConfirmAsync } from "@/utils/swal-saas";
import { Filter, FilterX, ImageOff, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Select from "react-select";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { appToolbarSelectStyles } from "@/components/ui/react-select-app-styles";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useServerAction } from "@/hooks/use-server-action";
import { deleteProductAction } from "./actions";
import { ProductFormDialog } from "./ProductFormDialog";
import { ProductDetailDrawer } from "./ProductDetailDrawer";
import { AdminEditDeleteRowMenu } from "@/components/admin/admin-edit-delete-row-menu";
import { SortableHeader } from "@/components/admin/admin-sortable-table-header";
import { ProductProfileCard } from "@/components/dashboard/product-profile-card";
import { useI18n } from "@/components/i18n/I18nProvider";

type Props = {
  products: Product[];
  brands: Brand[];
  brandTypes: BrandType[];
  specificCharacteristics: SpecificCharacteristic[];
  categories: AdminCategory[];
  subcategories: AdminSubcategory[];
  isLoading?: boolean;
};

type FilterOption = { value: string; label: string };

/** Ancho del select «Todas las marcas» en barra escritorio (xl+): texto de referencia + margen (`ch`). */
const BRAND_FILTER_TOOLBAR_WIDE_CH = "Todas las marcas".length + 7;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function localizedProductName(row: Product, locale: string): string {
  if (locale === "en") return row.nameEn?.trim() || row.name;
  return row.name;
}

function localizedBrandName(row: Product, locale: string): string {
  if (locale === "en") return row.brandNameEn?.trim() || row.brandName;
  return row.brandName;
}

function localizedBrandTypeName(row: Product, locale: string): string {
  if (locale === "en") return row.brandTypeNameEn?.trim() || row.brandTypeName;
  return row.brandTypeName;
}

function localizedCatalogLabel(row: Product, locale: string): string {
  if (locale === "en") return row.catalogLabelEn?.trim() || row.catalogLabel;
  return row.catalogLabel;
}

function stockBadgeClass(stock: number): string {
  /** Misma caja que `activeBadgeClass` + borde de color acorde al nivel de stock. */
  const base =
    "inline-flex items-center justify-center gap-0.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium";
  if (stock <= 0) {
    return `${base} border-red-200/90 bg-red-100 text-red-800 dark:border-red-800/50 dark:bg-red-950/45 dark:text-red-200`;
  }
  if (stock <= 10) {
    return `${base} border-amber-200/90 bg-amber-100 text-amber-900 dark:border-amber-800/45 dark:bg-amber-950/40 dark:text-amber-200`;
  }
  return `${base} border-emerald-200/90 bg-emerald-100 text-emerald-700 dark:border-emerald-800/45 dark:bg-emerald-950/35 dark:text-emerald-200`;
}

/** Texto categoría / subcategoría a partir de `catalogLabel` («Padre › Hijo» o solo categoría). */
function formatProductCategoryLine(catalogLabel: string): string {
  const t = catalogLabel.trim();
  if (!t || t === "—") return "—";
  const parts = t
    .split(/\s*›\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]} · ${parts[1]}`;
  }
  return parts[0] ?? "—";
}

function activeBadgeClass(active: boolean): string {
  return active
    ? "inline-flex items-center rounded-full border border-emerald-200/90 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
    : "inline-flex items-center rounded-full border border-slate-200/90 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700";
}

function discountBadgeClass(kind: "business" | "client"): string {
  return kind === "business"
    ? "inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
    : "inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground";
}

function RowActions({
  onView,
  onEdit,
  onDelete,
  isDeleting,
  t,
}: {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  t: (key: string) => string;
}) {
  return (
    <AdminEditDeleteRowMenu
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
      isDeleting={isDeleting}
      openActionsLabel={t("admin.products.menu.openActions")}
      viewLabel={t("admin.products.menu.viewDetails")}
      editLabel={t("admin.common.actionEdit")}
      deleteLabel={t("admin.products.menu.delete")}
      deletingLabel={t("admin.products.menu.deleting")}
    />
  );
}

export function AdminProductsTable({
  products,
  brands,
  brandTypes,
  specificCharacteristics,
  categories,
  subcategories,
  isLoading = false,
}: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [brandTypeFilter, setBrandTypeFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const [draftBrand, setDraftBrand] = useState<string>("all");
  const [draftBrandType, setDraftBrandType] = useState<string>("all");
  const [draftActive, setDraftActive] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [viewing, setViewing] = useState<Product | null>(null);
  const { executeAsync: executeDeleteAsync, isPending: isDeleting } =
    useServerAction(deleteProductAction, {
      successMessage: t("admin.products.toast.deleted"),
      errorMessage: t("admin.products.toast.deleteError"),
      onSuccess: () => {
        router.refresh();
        setViewing(null);
      },
    });

  const handleDeleteProduct = useCallback(
    async (product: Product) => {
      await swalSaasConfirmAsync({
        title: t("admin.products.confirm.deleteTitle"),
        html: `${t("admin.products.confirm.deleteMessagePrefix")} <strong>${localizedProductName(product, locale)}</strong> (SKU: <strong>${product.sku}</strong>).`,
        confirmButtonText: t("admin.products.confirm.deleteConfirm"),
        cancelButtonText: t("admin.products.form.cancel"),
        variant: "destructive",
        iconType: "warning",
        preConfirm: () => executeDeleteAsync(product.id),
      });
    },
    [executeDeleteAsync, locale, t],
  );

  const brandFilterOptions = useMemo<FilterOption[]>(
    () => [
      { value: "all", label: t("admin.products.filters.brandAll") },
      ...brands.map((b) => ({ value: b.id, label: b.name })),
    ],
    [brands, t],
  );

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesBrand = brandFilter === "all" || p.brandId === brandFilter;
      const matchesBrandType =
        brandTypeFilter === "all" || p.brandTypeId === brandTypeFilter;
      const matchesActive =
        activeFilter === "all" ||
        (activeFilter === "active" ? p.active : !p.active);
      return matchesBrand && matchesBrandType && matchesActive;
    });
  }, [products, brandFilter, brandTypeFilter, activeFilter]);

  const brandFilterValue =
    brandFilterOptions.find((o) => o.value === brandFilter) ??
    brandFilterOptions[0];

  const brandTypeFilterOptions = useMemo<FilterOption[]>(
    () => [
      { value: "all", label: t("admin.products.filters.typeAll") },
      ...brandTypes
        .filter((t) => brandFilter === "all" || t.brandId === brandFilter)
        .map((t) => ({ value: t.id, label: `${t.brandName} · ${t.name}` })),
    ],
    [brandTypes, brandFilter, t],
  );

  const brandTypeFilterValue =
    brandTypeFilterOptions.find((o) => o.value === brandTypeFilter) ??
    brandTypeFilterOptions[0];

  const activeFilterOptions = useMemo<FilterOption[]>(
    () => [
      { value: "all", label: t("admin.products.filters.status.all") },
      { value: "active", label: t("admin.products.filters.status.active") },
      { value: "inactive", label: t("admin.products.filters.status.inactive") },
    ],
    [t],
  );

  const activeFilterValue =
    activeFilterOptions.find((o) => o.value === activeFilter) ??
    activeFilterOptions[0];

  /** Filtros distintos de «todos» (marca, tipo, estado). */
  const appliedFiltersCount = useMemo(() => {
    let n = 0;
    if (brandFilter !== "all") n += 1;
    if (brandTypeFilter !== "all") n += 1;
    if (activeFilter !== "all") n += 1;
    return n;
  }, [brandFilter, brandTypeFilter, activeFilter]);

  const modalBrandTypeOptions = useMemo<FilterOption[]>(
    () => [
      { value: "all", label: t("admin.products.filters.typeAll") },
      ...brandTypes
        .filter((t) => draftBrand === "all" || t.brandId === draftBrand)
        .map((t) => ({ value: t.id, label: `${t.brandName} · ${t.name}` })),
    ],
    [brandTypes, draftBrand, t],
  );

  const draftBrandFilterValue =
    brandFilterOptions.find((o) => o.value === draftBrand) ??
    brandFilterOptions[0];

  const draftBrandTypeFilterValue =
    modalBrandTypeOptions.find((o) => o.value === draftBrandType) ??
    modalBrandTypeOptions[0];

  const draftActiveFilterValue =
    activeFilterOptions.find((o) => o.value === draftActive) ??
    activeFilterOptions[0];

  const openFiltersModal = () => {
    setDraftBrand(brandFilter);
    setDraftBrandType(brandTypeFilter);
    setDraftActive(activeFilter);
    setFiltersModalOpen(true);
  };

  const handleClearModalFilters = () => {
    setDraftBrand("all");
    setDraftBrandType("all");
    setDraftActive("all");
  };

  const handleApplyModalFilters = () => {
    setBrandFilter(draftBrand);
    setBrandTypeFilter(draftBrandType);
    setActiveFilter(draftActive);
    setFiltersModalOpen(false);
  };

  const clearToolbarFilters = useCallback(() => {
    setBrandFilter("all");
    setBrandTypeFilter("all");
    setActiveFilter("all");
  }, []);

  const renderMobileRow = useCallback((row: Row<Product>) => {
    const p = row.original;
    return (
      <li key={row.id}>
        <ProductProfileCard
          name={p.name}
          nameEn={p.nameEn}
          sku={p.sku}
          imageUrl={p.imageUrl}
          catalogLabel={p.catalogLabel}
          brandName={p.brandName}
          brandTypeName={p.brandTypeName}
          price={p.priceClient}
          stock={p.stock}
          active={p.active}
          className="hover:bg-muted/50 transition-colors duration-150"
          actions={
            <RowActions
              onView={() => setViewing(p)}
              onEdit={() => {
                setEditing(p);
                setDialogOpen(true);
              }}
              onDelete={() => void handleDeleteProduct(p)}
              isDeleting={isDeleting}
              t={t}
            />
          }
        />
      </li>
    );
  }, [handleDeleteProduct, isDeleting]);

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        id: "product",
        accessorFn: (row) =>
          `${row.name} ${row.nameEn ?? ""} ${row.sku} ${row.brandName} ${row.brandNameEn ?? ""} ${row.brandTypeName} ${row.brandTypeNameEn ?? ""} ${row.catalogLabel} ${row.catalogLabelEn ?? ""} ${row.description ?? ""} ${row.descriptionEn ?? ""}`,
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          localizedProductName(rowA.original, locale).localeCompare(
            localizedProductName(rowB.original, locale),
            locale,
            {
            sensitivity: "base",
            },
          ),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.products.table.product")}
            ariaLabelIdle={t("admin.products.table.productSortIdle")}
            ariaLabelAsc={t("admin.products.table.sortAsc")}
            ariaLabelDesc={t("admin.products.table.sortDesc")}
          />
        ),
        meta: {
          cellClassName:
            "min-w-0 max-w-[min(32.25rem,65vw)] md:max-w-[min(24.25rem,38vw)]",
        },
        cell: ({ row }) => {
          const p = row.original;
          const categoryLine = formatProductCategoryLine(
            localizedCatalogLabel(p, locale),
          );
          return (
            <div className="flex min-w-0 items-center gap-3">
              {p.imageUrl ? (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border/80 bg-muted">
                  <Image
                    src={p.imageUrl}
                    alt={localizedProductName(p, locale)}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-muted text-muted-foreground">
                  <ImageOff className="h-5 w-5" aria-hidden />
                  <span className="sr-only">{t("admin.products.table.noImage")}</span>
                </span>
              )}
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="truncate text-[15px] font-semibold leading-5 text-foreground">
                  {localizedProductName(p, locale)}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                    <span className="font-medium">{t("admin.products.table.sku")}:</span>{" "}
                  <span className="tabular-nums">{p.sku}</span>
                </p>
                {categoryLine !== "—" ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {categoryLine}
                  </p>
                ) : null}
              </div>
            </div>
          );
        },
      },
      {
        id: "brand",
        accessorFn: (row) =>
          `${row.brandName} ${row.brandNameEn ?? ""} ${row.brandTypeName ?? ""} ${row.brandTypeNameEn ?? ""}`,
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          localizedBrandName(rowA.original, locale).localeCompare(
            localizedBrandName(rowB.original, locale),
            locale,
            {
              sensitivity: "base",
            },
          ),
        meta: { cellClassName: "w-[10rem] min-w-[10rem]" },
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.products.table.brand")}
            ariaLabelIdle={t("admin.products.table.brandSortIdle")}
            ariaLabelAsc={t("admin.products.table.sortAsc")}
            ariaLabelDesc={t("admin.products.table.sortDesc")}
          />
        ),
        cell: ({ row }) => {
          const p = row.original;
          const brandName = localizedBrandName(p, locale);
          const brandTypeName = localizedBrandTypeName(p, locale);
          return (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {brandName}
              </p>
              {brandTypeName && brandTypeName !== "—" ? (
                <p className="truncate text-xs text-muted-foreground">
                  {brandTypeName}
                </p>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "priceClient",
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          rowA.original.priceClient - rowB.original.priceClient,
        meta: { cellClassName: "w-[7.5rem]" },
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.products.table.price")}
            ariaLabelIdle={t("admin.products.table.priceSortIdle")}
            ariaLabelAsc={t("admin.products.table.priceSortAsc")}
            ariaLabelDesc={t("admin.products.table.priceSortDesc")}
          />
        ),
        cell: ({ row }) => (
          <span className="text-base font-semibold text-foreground">
            {formatCurrency(row.original.priceClient)}
          </span>
        ),
      },
      {
        accessorKey: "stock",
        enableSorting: true,
        sortingFn: (rowA, rowB) => rowA.original.stock - rowB.original.stock,
        meta: { cellClassName: "w-[11.5rem] min-w-[11.5rem]" },
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.products.table.stock")}
            ariaLabelIdle={t("admin.products.table.stockSortIdle")}
            ariaLabelAsc={t("admin.products.table.stockSortAsc")}
            ariaLabelDesc={t("admin.products.table.stockSortDesc")}
          />
        ),
        cell: ({ row }) => {
          const n = row.original.stock;
          return (
            <span className={stockBadgeClass(n)}>
              <span className="tabular-nums">{n}</span>
              <span> {t("admin.products.table.inStock")}</span>
            </span>
          );
        },
      },
      {
        id: "active",
        accessorKey: "active",
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          Number(rowA.original.active) - Number(rowB.original.active),
        meta: { cellClassName: "w-[7.5rem]" },
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.products.table.status")}
            ariaLabelIdle={t("admin.products.table.statusSortIdle")}
            ariaLabelAsc={t("admin.products.table.statusSortAsc")}
            ariaLabelDesc={t("admin.products.table.statusSortDesc")}
          />
        ),
        cell: ({ row }) => (
          <span className={activeBadgeClass(row.original.active)}>
            {row.original.active
              ? t("admin.products.table.statusActive")
              : t("admin.products.table.statusInactive")}
          </span>
        ),
      },
      {
        id: "discounts",
        accessorFn: (row) =>
          `${row.discountBusinessPct} ${row.discountClientPct}`,
        meta: { cellClassName: "w-[10rem]" },
        header: t("admin.products.table.discounts"),
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-2">
            <span className={discountBadgeClass("business")}>
              {t("admin.products.table.discountBusinessShort")}{" "}
              {row.original.discountBusinessPct}%
            </span>
            <span className={discountBadgeClass("client")}>
              {t("admin.products.table.discountClientShort")}{" "}
              {row.original.discountClientPct}%
            </span>
          </div>
        ),
      },
      {
        id: "actions",
        meta: {
          align: "right",
          cellClassName:
            "min-w-[4.25rem] w-[4.25rem] max-w-[4.25rem] shrink-0 pl-2.5 md:pl-3",
        },
        header: () => <span className="sr-only">{t("admin.products.table.actions")}</span>,
        cell: ({ row }) => (
          <RowActions
            onView={() => setViewing(row.original)}
            onEdit={() => {
              setEditing(row.original);
              setDialogOpen(true);
            }}
            onDelete={() => void handleDeleteProduct(row.original)}
            isDeleting={isDeleting}
            t={t}
          />
        ),
      },
    ],
    [locale, t, isDeleting, handleDeleteProduct],
  );

  return (
    <div className="space-y-4">
      {/* Móvil / tablet: buscar · [Filtros] [Nuevo] — filtros en modal */}
      <div className="flex flex-col gap-3 xl:hidden">
        <div className="relative flex w-full items-center">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            placeholder={t("admin.products.filters.searchMobilePlaceholder")}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            disabled={isLoading}
            className="h-9 w-full rounded-lg border-border/90 bg-background pl-9 pr-3 text-sm shadow-sm transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
            autoComplete="off"
            spellCheck={false}
            aria-label={t("admin.products.filters.searchAria")}
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 min-w-0 flex-1 gap-2"
            disabled={isLoading}
            onClick={openFiltersModal}
            aria-label={
              appliedFiltersCount > 0
                ? t("admin.products.filters.openWithCount").replace(
                    "{count}",
                    String(appliedFiltersCount),
                  )
                : t("admin.products.filters.open")
            }
          >
            <Filter className="h-4 w-4 shrink-0" aria-hidden />
            {t("admin.products.filters.button")}
            {appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}
          </Button>
          <Button
            type="button"
            className="h-9 min-w-0 flex-1"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4 shrink-0" aria-hidden />
            {t("admin.products.buttonNew")}
          </Button>
        </div>
      </div>

      {/* Escritorio (xl+): buscar + selects en línea + Nuevo */}
      <div className="hidden flex-col gap-3 min-[1521px]:flex-nowrap min-[1521px]:gap-3 xl:flex xl:flex-row xl:flex-wrap xl:items-center">
        <div className="relative flex w-full items-center xl:flex-1 min-[1521px]:flex-none min-[1521px]:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            placeholder={t("admin.products.filters.searchDesktopPlaceholder")}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            disabled={isLoading}
            className="h-9 w-full rounded-lg border-border/90 bg-background pl-9 pr-3 text-sm shadow-sm transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
            autoComplete="off"
            spellCheck={false}
            aria-label={t("admin.products.filters.searchAria")}
          />
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center xl:items-center xl:max-[1520px]:order-3 xl:max-[1520px]:basis-full min-[1521px]:flex-1 min-[1521px]:min-w-0">
          <div
            className="flex min-w-0 flex-1 items-center xl:box-border xl:w-[var(--toolbar-brand-filter-all-w)] xl:min-w-[var(--toolbar-brand-filter-all-w)] xl:max-w-[var(--toolbar-brand-filter-all-w)] xl:flex-none xl:shrink-0"
            style={
              {
                ["--toolbar-brand-filter-all-w" as string]: `${BRAND_FILTER_TOOLBAR_WIDE_CH}ch`,
              } as CSSProperties
            }
          >
            <Select<FilterOption, false>
              instanceId="products-brand-filter"
              inputId="products-brand-filter-input"
              aria-label="Filtrar por marca"
              isSearchable={false}
              isClearable={false}
              options={brandFilterOptions}
              value={brandFilterValue}
              onChange={(opt) => {
                if (opt) {
                  setBrandFilter(opt.value);
                  setBrandTypeFilter("all");
                }
              }}
              styles={appToolbarSelectStyles}
              className="w-full min-w-0"
            />
          </div>
          <div className="flex min-w-0 flex-1 items-center">
            <Select<FilterOption, false>
              instanceId="products-brand-type-filter"
              inputId="products-brand-type-filter-input"
              aria-label="Filtrar por tipo por marca"
              isSearchable={false}
              isClearable={false}
              options={brandTypeFilterOptions}
              value={brandTypeFilterValue}
              onChange={(opt) => {
                if (opt) setBrandTypeFilter(opt.value);
              }}
              styles={appToolbarSelectStyles}
              className="w-full"
            />
          </div>
          <div className="flex w-full min-w-0 flex-1 items-center min-[1440px]:max-w-[13rem]">
            <Select<FilterOption, false>
              instanceId="products-active-filter"
              inputId="products-active-filter-input"
              aria-label="Filtrar por estado de producto"
              isSearchable={false}
              isClearable={false}
              options={activeFilterOptions}
              value={activeFilterValue}
              onChange={(opt) => {
                if (opt) setActiveFilter(opt.value);
              }}
              styles={appToolbarSelectStyles}
              className="w-full"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 border-border/80 text-muted-foreground hover:text-foreground"
            disabled={isLoading || appliedFiltersCount === 0}
            onClick={clearToolbarFilters}
            title={t("admin.products.filters.clear")}
            aria-label={t("admin.products.filters.clear")}
          >
            <FilterX className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        <div className="flex w-full items-center xl:max-[1520px]:order-2 xl:max-[1520px]:w-auto xl:max-[1520px]:shrink-0 min-[1521px]:ml-auto min-[1521px]:w-auto min-[1521px]:shrink-0">
          <Button
            type="button"
            className="h-9 w-full shrink-0 md:w-24"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            {t("admin.products.buttonNew")}
          </Button>
        </div>
      </div>

      <Dialog open={filtersModalOpen} onOpenChange={setFiltersModalOpen}>
        <DialogContent className="gap-0 overflow-hidden border-border/60 p-0 shadow-xl ring-1 ring-black/[0.04] w-[min(22rem,calc(100vw-2rem))] max-w-[min(22rem,calc(100vw-2rem))] rounded-2xl">
          <DialogHeader className="space-y-0 border-b border-border/60 bg-muted/25 px-6 pb-5 pt-6 text-left">
            <div className="flex gap-4 pr-10">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/10"
                aria-hidden
              >
                <Filter className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="min-w-0 space-y-1.5 pt-0.5">
                <DialogTitle className="text-lg font-semibold leading-tight tracking-tight text-foreground">
                  {t("admin.products.filters.modalTitle")}
                </DialogTitle>
                <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                  {t("admin.products.filters.modalDescription")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="max-h-[min(52vh,20rem)] overflow-y-auto px-6 py-5">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="products-filter-modal-brand"
                  className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                >
                  {t("admin.products.filters.brandLabel")}
                </Label>
                <div className="flex w-full min-w-0 items-center">
                  <Select<FilterOption, false>
                    instanceId="products-brand-filter-modal"
                    inputId="products-filter-modal-brand"
                    aria-label={t("admin.products.filters.brandLabel")}
                    isSearchable={false}
                    isClearable={false}
                    options={brandFilterOptions}
                    value={draftBrandFilterValue}
                    onChange={(opt) => {
                      if (opt) {
                        setDraftBrand(opt.value);
                        setDraftBrandType("all");
                      }
                    }}
                    styles={appToolbarSelectStyles}
                    className="w-full"
                    menuPlacement="auto"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="products-filter-modal-type"
                  className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                >
                  {t("admin.products.filters.typeLabel")}
                </Label>
                <div className="flex w-full min-w-0 items-center">
                  <Select<FilterOption, false>
                    instanceId="products-brand-type-filter-modal"
                    inputId="products-filter-modal-type"
                    aria-label={t("admin.products.filters.typeLabel")}
                    isSearchable={false}
                    isClearable={false}
                    options={modalBrandTypeOptions}
                    value={draftBrandTypeFilterValue}
                    onChange={(opt) => {
                      if (opt) setDraftBrandType(opt.value);
                    }}
                    styles={appToolbarSelectStyles}
                    className="w-full"
                    menuPlacement="auto"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="products-filter-modal-active"
                  className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                >
                  {t("admin.products.filters.statusLabel")}
                </Label>
                <div className="flex w-full min-w-0 items-center">
                  <Select<FilterOption, false>
                    instanceId="products-active-filter-modal"
                    inputId="products-filter-modal-active"
                    aria-label={t("admin.products.filters.statusLabel")}
                    isSearchable={false}
                    isClearable={false}
                    options={activeFilterOptions}
                    value={draftActiveFilterValue}
                    onChange={(opt) => {
                      if (opt) setDraftActive(opt.value);
                    }}
                    styles={appToolbarSelectStyles}
                    className="w-full"
                    menuPlacement="auto"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-row justify-end gap-2 border-t border-border/60 bg-muted/15 px-6 py-4 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={handleClearModalFilters}
            >
              {t("admin.products.filters.clear")}
            </Button>
            <Button
              type="button"
              className="min-w-[6.5rem] shadow-sm"
              onClick={handleApplyModalFilters}
            >
              {t("admin.products.filters.apply")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DataTable
        columns={columns}
        data={filteredProducts}
        isLoading={isLoading}
        enableSorting
        hideToolbar
        externalGlobalFilter={globalFilter}
        onExternalGlobalFilterChange={setGlobalFilter}
        tableClassName="table-fixed"
        tableHeadCellClassName="!font-medium"
        tableBodyCellClassName="py-2.5"
        paginationButtonVariant="ghost"
        paginationClassName="border-border/50"
        getRowClassName={() =>
          "hover:bg-muted/50 transition-colors duration-150"
        }
        renderMobileRow={renderMobileRow}
      />

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        product={editing}
        brands={brands}
        brandTypes={brandTypes}
        specificCharacteristics={specificCharacteristics}
        categories={categories}
        subcategories={subcategories}
      />
      <ProductDetailDrawer
        product={viewing}
        onClose={() => setViewing(null)}
        onEdit={(product) => {
          setViewing(null);
          setEditing(product);
          setDialogOpen(true);
        }}
        onDelete={(product) => void handleDeleteProduct(product)}
      />
    </div>
  );
}
