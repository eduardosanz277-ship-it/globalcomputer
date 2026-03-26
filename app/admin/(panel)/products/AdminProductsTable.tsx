"use client";

import { useCallback, useMemo, useState } from "react";
import type { Brand } from "@/modules/admin/brands/brands.types";
import type { BrandType } from "@/modules/admin/brand-types/brand-types.types";
import type { Product } from "@/modules/admin/products/products.types";
import type { SpecificCharacteristic } from "@/modules/admin/specific-characteristics/specific-characteristics.types";
import type { ColumnDef, Row } from "@tanstack/react-table";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { ImageOff, Plus } from "lucide-react";
import Select from "react-select";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { appSelectStyles } from "@/components/ui/react-select-app-styles";
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
  isLoading?: boolean;
};

type FilterOption = { value: string; label: string };

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function stockBadgeClass(stock: number): string {
  return stock <= 0
    ? "inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700"
    : "inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700";
}

function discountBadgeClass(kind: "business" | "client"): string {
  return kind === "business"
    ? "inline-flex items-center rounded-full border border-blue-200/90 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800"
    : "inline-flex items-center rounded-full border border-slate-200/90 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700";
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
  isLoading = false,
}: Props) {
  const router = useRouter();
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [brandTypeFilter, setBrandTypeFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [viewing, setViewing] = useState<Product | null>(null);
  const { execute: executeDelete, isPending: isDeleting } = useServerAction(
    deleteProductAction,
    {
      successMessage: "Producto eliminado",
      errorMessage: "No se pudo eliminar el producto",
      onSuccess: () => {
        router.refresh();
        setViewing(null);
      },
    },
  );

  const handleDeleteProduct = useCallback(
    async (product: Product) => {
      const result = await Swal.fire({
        title: "¿Eliminar producto?",
        html: `Vas a eliminar <strong>${product.name}</strong> (SKU: <strong>${product.sku}</strong>).`,
        icon: "warning",
        showCancelButton: true,
        reverseButtons: true,
        focusCancel: true,
        confirmButtonText: "Eliminar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "hsl(0 72% 45%)",
        cancelButtonColor: "hsl(215 16% 47%)",
        customClass: { popup: "swal-equal-width-buttons" },
      });

      if (!result.isConfirmed) return;
      executeDelete(product.id);
    },
    [executeDelete],
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
      return matchesBrand && matchesBrandType;
    });
  }, [products, brandFilter, brandTypeFilter]);

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

  const renderMobileRow = useCallback((row: Row<Product>) => {
    const p = row.original;
    return (
      <li key={row.id}>
        <ProductProfileCard
          name={p.name}
          sku={p.sku}
          imageUrl={p.imageUrl}
          brandName={p.brandName}
          brandTypeName={p.brandTypeName}
          price={p.price}
          stock={p.stock}
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
        accessorFn: (row) => `${row.name} ${row.sku} ${row.description ?? ""}`,
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
            "min-w-0 max-w-[min(42rem,85vw)] md:max-w-[min(28rem,50vw)]",
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
                  SKU: {p.sku} · {p.brandName} · {p.brandTypeName}
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
        accessorKey: "price",
        enableSorting: true,
        sortingFn: (rowA, rowB) => rowA.original.price - rowB.original.price,
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
      <DataTable
        columns={columns}
        data={filteredProducts}
        isLoading={isLoading}
        enableSorting
        searchPlaceholder="Buscar por SKU, nombre, marca o descripción…"
        tableHeadCellClassName="!font-medium"
        tableBodyCellClassName="py-2.5"
        paginationButtonVariant="ghost"
        paginationClassName="border-border/50"
        getRowClassName={() =>
          "hover:bg-muted/50 transition-colors duration-150"
        }
        renderMobileRow={renderMobileRow}
        toolbarFilters={
          <div className="flex w-full min-w-0 flex-col gap-2 lg:flex-row lg:flex-nowrap lg:gap-2">
            <div className="min-w-0 w-full lg:flex-1 lg:min-w-0 min-[1440px]:max-w-[13rem] min-[1440px]:flex-none">
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
                styles={appSelectStyles}
                className="w-full"
              />
            </div>
            <div className="min-w-0 w-full lg:flex-1 lg:min-w-0 min-[1440px]:max-w-[14rem] min-[1440px]:flex-none">
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
                styles={appSelectStyles}
                className="w-full"
              />
            </div>
          </div>
        }
        toolbarActions={
          <Button
            type="button"
            className="w-full shrink-0 min-[1440px]:w-auto"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            Nuevo
          </Button>
        }
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
