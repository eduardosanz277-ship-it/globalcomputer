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
import { AdminTableEmptyEmDash } from "@/components/admin/admin-table-empty";
import { AdminEditDeleteRowMenu } from "@/components/admin/admin-edit-delete-row-menu";
import { SortableHeader } from "@/components/admin/admin-sortable-table-header";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { formatRelativeLastAccess } from "@/utils/formatRelativeLastAccess";
import { ProductProfileCard } from "@/components/dashboard/product-profile-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

function stockBadgeClass(stock: number): string {
  return stock <= 0
    ? "inline-flex items-center rounded-full bg-neutral-600 px-2.5 py-1 text-xs font-medium text-white"
    : "inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700";
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

function updatedAtSortMs(row: Product): number {
  const t = new Date(row.updatedAt).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function RowActions({
  onView,
  onEdit,
  onDelete,
  isDeleting,
}: {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <AdminEditDeleteRowMenu
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
      isDeleting={isDeleting}
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
      successMessage: "Producto eliminado",
      errorMessage: "No se pudo eliminar el producto",
      onSuccess: () => {
        router.refresh();
        setViewing(null);
      },
    });

  const handleDeleteProduct = useCallback(
    async (product: Product) => {
      await swalSaasConfirmAsync({
        title: "¿Eliminar producto?",
        html: `Vas a eliminar <strong>${product.name}</strong> (SKU: <strong>${product.sku}</strong>).`,
        confirmButtonText: "Eliminar",
        variant: "destructive",
        iconType: "warning",
        preConfirm: () => executeDeleteAsync(product.id),
      });
    },
    [executeDeleteAsync],
  );

  const brandFilterOptions = useMemo<FilterOption[]>(
    () => [
      { value: "all", label: "Todas las marcas" },
      ...brands.map((b) => ({ value: b.id, label: b.name })),
    ],
    [brands],
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
      { value: "all", label: "Todos los tipos" },
      ...brandTypes
        .filter((t) => brandFilter === "all" || t.brandId === brandFilter)
        .map((t) => ({ value: t.id, label: `${t.brandName} · ${t.name}` })),
    ],
    [brandTypes, brandFilter],
  );

  const brandTypeFilterValue =
    brandTypeFilterOptions.find((o) => o.value === brandTypeFilter) ??
    brandTypeFilterOptions[0];

  const activeFilterOptions = useMemo<FilterOption[]>(
    () => [
      { value: "all", label: "Todos los estados" },
      { value: "active", label: "Activos" },
      { value: "inactive", label: "Inactivos" },
    ],
    [],
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
      { value: "all", label: "Todos los tipos" },
      ...brandTypes
        .filter((t) => draftBrand === "all" || t.brandId === draftBrand)
        .map((t) => ({ value: t.id, label: `${t.brandName} · ${t.name}` })),
    ],
    [brandTypes, draftBrand],
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
          sku={p.sku}
          imageUrl={p.imageUrl}
          catalogLabel={p.catalogLabel}
          brandName={p.brandName}
          brandTypeName={p.brandTypeName}
          price={p.price}
          stock={p.stock}
          active={p.active}
          updatedAt={p.updatedAt}
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
            />
          }
        />
      </li>
    );
  }, []);

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        id: "product",
        accessorFn: (row) =>
          `${row.name} ${row.sku} ${row.catalogLabel} ${row.description ?? ""}`,
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          rowA.original.name.localeCompare(rowB.original.name, "es", {
            sensitivity: "base",
          }),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label="Producto"
            ariaLabelIdle="Ordenar por nombre"
            ariaLabelAsc="Ordenado de la A a la Z. Clic para invertir"
            ariaLabelDesc="Ordenado de la Z a la A. Clic para quitar orden"
          />
        ),
        meta: {
          cellClassName:
            "min-w-0 max-w-[min(28rem,65vw)] md:max-w-[min(20rem,38vw)]",
        },
        cell: ({ row }) => {
          const p = row.original;
          const desc = p.description?.trim();
          return (
            <div className="flex min-w-0 items-center gap-3">
              {p.imageUrl ? (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border/80 bg-muted">
                  <Image
                    src={p.imageUrl}
                    alt={p.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-muted text-muted-foreground">
                  <ImageOff className="h-5 w-5" aria-hidden />
                  <span className="sr-only">Sin imagen</span>
                </span>
              )}
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="truncate text-[15px] font-semibold leading-5 text-foreground">
                  {p.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  SKU: {p.sku} · {p.catalogLabel} · {p.brandName} ·{" "}
                  {p.brandTypeName}
                </p>
                {desc ? (
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {desc}
                  </p>
                ) : (
                  <AdminTableEmptyEmDash className="text-xs" />
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "stock",
        enableSorting: true,
        sortingFn: (rowA, rowB) => rowA.original.stock - rowB.original.stock,
        meta: { cellClassName: "w-[7.5rem]" },
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label="Stock"
            ariaLabelIdle="Ordenar por stock"
            ariaLabelAsc="Stock menor a mayor. Clic para invertir"
            ariaLabelDesc="Stock mayor a menor. Clic para quitar orden"
          />
        ),
        cell: ({ row }) => (
          <span className={stockBadgeClass(row.original.stock)}>
            {row.original.stock <= 0
              ? "Sin stock"
              : `${row.original.stock} en stock`}
          </span>
        ),
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
            label="Estado"
            ariaLabelIdle="Ordenar por estado"
            ariaLabelAsc="Inactivos primero. Clic para invertir"
            ariaLabelDesc="Activos primero. Clic para quitar orden"
          />
        ),
        cell: ({ row }) => (
          <span className={activeBadgeClass(row.original.active)}>
            {row.original.active ? "Activo" : "Inactivo"}
          </span>
        ),
      },
      {
        accessorKey: "price",
        enableSorting: true,
        sortingFn: (rowA, rowB) => rowA.original.price - rowB.original.price,
        meta: { cellClassName: "w-[7.5rem]" },
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label="Precio"
            ariaLabelIdle="Ordenar por precio"
            ariaLabelAsc="Precio menor a mayor. Clic para invertir"
            ariaLabelDesc="Precio mayor a menor. Clic para quitar orden"
          />
        ),
        cell: ({ row }) => (
          <span className="text-base font-semibold text-foreground">
            {formatCurrency(row.original.price)}
          </span>
        ),
      },
      {
        id: "discounts",
        accessorFn: (row) => `${row.discountBusinessPct} ${row.discountClient}`,
        meta: { cellClassName: "w-[10rem]" },
        header: "Descuentos",
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-2">
            <span className={discountBadgeClass("business")}>
              Empresa {row.original.discountBusinessPct}%
            </span>
            <span className={discountBadgeClass("client")}>
              Cliente {row.original.discountClient}%
            </span>
          </div>
        ),
      },
      {
        id: "updatedAt",
        accessorKey: "updatedAt",
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          updatedAtSortMs(rowA.original) - updatedAtSortMs(rowB.original),
        meta: { cellClassName: "w-[10rem]" },
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label="Última actualización"
            ariaLabelIdle="Ordenar por última actualización"
            ariaLabelAsc="Más antiguo primero. Clic para invertir"
            ariaLabelDesc="Más reciente primero. Clic para quitar orden"
          />
        ),
        cell: ({ row }) => {
          const raw = row.original.updatedAt;
          const relative = formatRelativeLastAccess(raw);
          const absolute = formatDateDdMmYyyyHhMm(raw);
          if (relative == null) {
            return (
              <span className="text-sm text-muted-foreground">{absolute}</span>
            );
          }
          return (
            <TooltipProvider delayDuration={120}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help text-sm text-muted-foreground">
                    {relative}
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="start"
                  className="rounded-xl border-border/60 bg-popover px-3 py-2 text-[11px] text-popover-foreground shadow-xl"
                >
                  <span className="block font-medium">
                    Última actualización
                  </span>
                  <span className="mt-0.5 block text-muted-foreground">
                    {absolute}
                  </span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        },
      },
      {
        id: "actions",
        meta: { align: "right", cellClassName: "w-[4.5rem]" },
        header: () => <span className="sr-only">Acciones</span>,
        cell: ({ row }) => (
          <RowActions
            onView={() => setViewing(row.original)}
            onEdit={() => {
              setEditing(row.original);
              setDialogOpen(true);
            }}
            onDelete={() => void handleDeleteProduct(row.original)}
            isDeleting={isDeleting}
          />
        ),
      },
    ],
    [],
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
            placeholder="Buscar productos"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            disabled={isLoading}
            className="h-9 w-full rounded-lg border-border/90 bg-background pl-9 pr-3 text-sm shadow-sm transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
            autoComplete="off"
            spellCheck={false}
            aria-label="Buscar productos"
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
                ? `Filtros, ${appliedFiltersCount} aplicados`
                : "Abrir filtros"
            }
          >
            <Filter className="h-4 w-4 shrink-0" aria-hidden />
            Filtros
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
            Nuevo
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
            placeholder="Buscar por SKU, nombre, marca o descripción…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            disabled={isLoading}
            className="h-9 w-full rounded-lg border-border/90 bg-background pl-9 pr-3 text-sm shadow-sm transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
            autoComplete="off"
            spellCheck={false}
            aria-label="Filtrar filas de la tabla"
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
            title="Limpiar filtros"
            aria-label="Limpiar filtros de marca, tipo y estado"
          >
            <FilterX className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        <div className="flex w-full items-center xl:max-[1520px]:order-2 xl:max-[1520px]:w-auto xl:max-[1520px]:shrink-0 min-[1521px]:ml-auto min-[1521px]:w-auto min-[1521px]:shrink-0">
          <Button
            type="button"
            className="h-9 w-full xl:w-auto"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            Nuevo
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
                  Filtros
                </DialogTitle>
                <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                  Refina por marca, tipo y estado. Los cambios se aplican al
                  pulsar Aplicar.
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
                  Marca
                </Label>
                <div className="flex w-full min-w-0 items-center">
                  <Select<FilterOption, false>
                    instanceId="products-brand-filter-modal"
                    inputId="products-filter-modal-brand"
                    aria-label="Marca"
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
                  Tipo
                </Label>
                <div className="flex w-full min-w-0 items-center">
                  <Select<FilterOption, false>
                    instanceId="products-brand-type-filter-modal"
                    inputId="products-filter-modal-type"
                    aria-label="Tipo"
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
                  Estado
                </Label>
                <div className="flex w-full min-w-0 items-center">
                  <Select<FilterOption, false>
                    instanceId="products-active-filter-modal"
                    inputId="products-filter-modal-active"
                    aria-label="Estado"
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
              Limpiar
            </Button>
            <Button
              type="button"
              className="min-w-[6.5rem] shadow-sm"
              onClick={handleApplyModalFilters}
            >
              Aplicar
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
