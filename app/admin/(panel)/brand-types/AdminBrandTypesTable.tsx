"use client";

import { useCallback, useMemo, useState } from "react";
import type { BrandType } from "@/modules/admin/brand-types/brand-types.types";
import type { Brand } from "@/modules/admin/brands/brands.types";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import Select from "react-select";
import { appSelectStyles } from "@/components/ui/react-select-app-styles";
import { AdminEditDeleteRowMenu } from "@/components/admin/admin-edit-delete-row-menu";
import { SortableHeader } from "@/components/admin/admin-sortable-table-header";
import { AdminTableEmptyEmDash } from "@/components/admin/admin-table-empty";
import { Layers, Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useServerAction } from "@/hooks/use-server-action";
import { deleteBrandTypeAction } from "./actions";
import { BrandTypeFormDialog } from "./BrandTypeFormDialog";
import { cn } from "@/utils/cn";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { formatRelativeLastAccess } from "@/utils/formatRelativeLastAccess";
import { BrandTypeProfileCard } from "@/components/dashboard/brand-type-profile-card";

const STATUS_FILTER_OPTIONS = [
  { value: "all" as const, label: "Todos los estados" },
  { value: "active" as const, label: "Activos" },
  { value: "inactive" as const, label: "Inactivos" },
];

type StatusFilter = (typeof STATUS_FILTER_OPTIONS)[number]["value"];

type FilterOption = { value: string; label: string };

interface Props {
  brands: Brand[];
  brandTypes: BrandType[];
  isLoading?: boolean;
}

function brandTypeSortValue(row: BrandType): string {
  return `${row.brandName ?? ""} ${row.name ?? ""}`
    .trim()
    .toLowerCase();
}

function updatedAtSortMs(row: BrandType): number {
  const t = new Date(row.updatedAt).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function RowActions({ row, onEdit }: { row: BrandType; onEdit: () => void }) {
  const router = useRouter();
  const { execute, isPending } = useServerAction(deleteBrandTypeAction, {
    successMessage: "Tipo eliminado",
    errorMessage: "No se pudo eliminar el tipo",
    onSuccess: () => {
      router.refresh();
    },
  });

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "¿Eliminar tipo?",
      html: `Vas a eliminar <strong>${row.name}</strong> (${row.brandName}). Si hay productos asociados, la operación no se permitirá.`,
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
    execute(row.id);
  };

  return (
    <AdminEditDeleteRowMenu
      onEdit={onEdit}
      onDelete={() => void handleDelete()}
      isDeleting={isPending}
    />
  );
}

export function AdminBrandTypesTable({
  brands,
  brandTypes,
  isLoading = false,
}: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BrandType | null>(null);

  const brandFilterOptions = useMemo<FilterOption[]>(
    () => [
      { value: "all", label: "Todas las marcas" },
      ...brands.map((b) => ({ value: b.id, label: b.name })),
    ],
    [brands],
  );

  const filtered = useMemo(() => {
    let rows = brandTypes;
    if (statusFilter === "active") rows = rows.filter((r) => r.active);
    else if (statusFilter === "inactive") rows = rows.filter((r) => !r.active);
    if (brandFilter !== "all") {
      rows = rows.filter((r) => r.brandId === brandFilter);
    }
    return rows;
  }, [brandTypes, statusFilter, brandFilter]);

  const statusFilterValue =
    STATUS_FILTER_OPTIONS.find((o) => o.value === statusFilter) ??
    STATUS_FILTER_OPTIONS[0];

  const brandFilterValue =
    brandFilterOptions.find((o) => o.value === brandFilter) ??
    brandFilterOptions[0];

  const columns = useMemo<ColumnDef<BrandType>[]>(
    () => [
      {
        id: "type",
        accessorFn: (row) => `${row.brandName} ${row.name}`.trim(),
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          brandTypeSortValue(rowA.original).localeCompare(
            brandTypeSortValue(rowB.original),
            "es",
            { sensitivity: "base" },
          ),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label="Tipo"
            ariaLabelIdle="Ordenar por marca y tipo"
            ariaLabelAsc="Ordenado de la A a la Z. Clic para invertir"
            ariaLabelDesc="Ordenado de la Z a la A. Clic para quitar orden"
          />
        ),
        meta: {
          cellClassName:
            "min-w-0 max-w-[min(28rem,50vw)] md:max-w-[min(22rem,40vw)]",
        },
        cell: ({ row }) => {
          const r = row.original;
          const title = r.name?.trim() || "—";
          const secondary = r.brandName?.trim();
          return (
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-foreground">
                {title}
              </p>
              {secondary ? (
                <p className="truncate text-sm text-muted-foreground">
                  {secondary}
                </p>
              ) : (
                <AdminTableEmptyEmDash className="text-sm" />
              )}
            </div>
          );
        },
      },
      {
        id: "active",
        accessorKey: "active",
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          Number(rowB.original.active) - Number(rowA.original.active),
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
          <span
            className={cn(
              "inline-flex max-w-full items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
              row.original.active
                ? "border border-emerald-200/90 bg-emerald-50 text-emerald-800 dark:text-emerald-200"
                : "border border-slate-200/90 bg-slate-100 text-slate-700",
            )}
          >
            {row.original.active ? "Activo" : "Inactivo"}
          </span>
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
          if (relative == null) {
            return (
              <span className="text-sm font-medium text-foreground">
                {formatDateDdMmYyyyHhMm(raw)}
              </span>
            );
          }
          const absolute = formatDateDdMmYyyyHhMm(raw);
          return (
            <span
              className="text-sm font-medium text-foreground"
              title={absolute || undefined}
            >
              {relative}
            </span>
          );
        },
      },
      {
        id: "actions",
        meta: { align: "right", cellClassName: "w-[4.5rem]" },
        header: () => <span className="sr-only">Acciones</span>,
        cell: ({ row }) => (
          <RowActions
            row={row.original}
            onEdit={() => {
              setEditing(row.original);
              setDialogOpen(true);
            }}
          />
        ),
      },
    ],
    [],
  );

  const renderMobileRow = useCallback(
    (row: Row<BrandType>) => {
      const r = row.original;
      return (
        <li key={row.id}>
          <BrandTypeProfileCard
            name={r.name}
            brandName={r.brandName}
            active={r.active}
            updatedAt={r.updatedAt}
            className="hover:bg-muted/50 transition-colors duration-150"
            actions={
              <RowActions
                row={r}
                onEdit={() => {
                  setEditing(r);
                  setDialogOpen(true);
                }}
              />
            }
          />
        </li>
      );
    },
    [],
  );

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        enableSorting
        toolbarLayout="stacked"
        searchPlaceholder="Buscar por marca o tipo…"
        tableHeadCellClassName="!font-medium"
        tableBodyCellClassName="py-4"
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
                instanceId="brand-types-brand-filter"
                inputId="brand-types-brand-filter-input"
                aria-label="Filtrar por marca"
                isSearchable={false}
                isClearable={false}
                options={brandFilterOptions}
                value={brandFilterValue}
                onChange={(opt) => {
                  if (opt) setBrandFilter(opt.value);
                }}
                styles={appSelectStyles}
                className="w-full"
              />
            </div>
            <div className="min-w-0 w-full lg:flex-1 lg:min-w-0 min-[1440px]:max-w-[13rem] min-[1440px]:flex-none">
              <Select<FilterOption, false>
                instanceId="brand-types-status-filter"
                inputId="brand-types-status-filter-input"
                aria-label="Filtrar por estado"
                isSearchable={false}
                isClearable={false}
                options={STATUS_FILTER_OPTIONS}
                value={statusFilterValue}
                onChange={(opt) => {
                  if (opt) setStatusFilter(opt.value as StatusFilter);
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
            disabled={brands.length === 0}
            title={
              brands.length === 0
                ? "Crea al menos una marca antes de añadir tipos"
                : undefined
            }
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            Nuevo
          </Button>
        }
      />

      {brands.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Layers className="h-4 w-4 shrink-0" aria-hidden />
          No hay marcas todavía. Crea una marca en la sección Marcas para poder
          definir tipos.
        </p>
      ) : null}

      <BrandTypeFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        brandType={editing}
        brands={brands}
      />
    </div>
  );
}
