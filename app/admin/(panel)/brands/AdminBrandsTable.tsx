"use client";

import { useCallback, useMemo, useState } from "react";
import type { Brand } from "@/modules/admin/brands/brands.types";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { swalSaasConfirmAsync } from "@/utils/swal-saas";
import Select from "react-select";
import { appToolbarSelectStyles } from "@/components/ui/react-select-app-styles";
import { AdminEditDeleteRowMenu } from "@/components/admin/admin-edit-delete-row-menu";
import { SortableHeader } from "@/components/admin/admin-sortable-table-header";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useServerAction } from "@/hooks/use-server-action";
import { deleteBrandAction } from "./actions";
import { BrandFormDialog } from "./BrandFormDialog";
import { BrandProfileCard } from "@/components/dashboard/brand-profile-card";
import { cn } from "@/utils/cn";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { formatRelativeLastAccess } from "@/utils/formatRelativeLastAccess";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const STATUS_FILTER_OPTIONS = [
  { value: "all" as const, label: "Todos los estados" },
  { value: "active" as const, label: "Activas" },
  { value: "inactive" as const, label: "Inactivas" },
];

type StatusFilter = (typeof STATUS_FILTER_OPTIONS)[number]["value"];

interface Props {
  brands: Brand[];
  isLoading?: boolean;
}

function updatedAtSortMs(b: Brand): number {
  const t = new Date(b.updatedAt).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function RowActions({ brand, onEdit }: { brand: Brand; onEdit: () => void }) {
  const router = useRouter();
  const { executeAsync, isPending } = useServerAction(deleteBrandAction, {
    successMessage: "Marca eliminada",
    errorMessage: "No se pudo eliminar la marca",
    onSuccess: () => {
      router.refresh();
    },
  });

  const handleDelete = async () => {
    await swalSaasConfirmAsync({
      title: "¿Eliminar marca?",
      html: `Vas a eliminar <strong>${brand.name}</strong>. Si hay productos asociados, la operación no se permitirá.`,
      confirmButtonText: "Eliminar",
      variant: "destructive",
      iconType: "warning",
      preConfirm: () => executeAsync(brand.id),
    });
  };

  return (
    <AdminEditDeleteRowMenu
      onEdit={onEdit}
      onDelete={() => void handleDelete()}
      isDeleting={isPending}
    />
  );
}

export function AdminBrandsTable({ brands, isLoading = false }: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return brands;
    if (statusFilter === "active") return brands.filter((b) => b.active);
    return brands.filter((b) => !b.active);
  }, [brands, statusFilter]);

  const filterValue =
    STATUS_FILTER_OPTIONS.find((o) => o.value === statusFilter) ??
    STATUS_FILTER_OPTIONS[0];

  const renderMobileRow = useCallback(
    (row: Row<Brand>) => {
      const b = row.original;
      return (
        <li key={row.id}>
          <BrandProfileCard
            name={b.name}
            active={b.active}
            updatedAt={b.updatedAt}
            className="hover:bg-muted/50 transition-colors duration-150"
            actions={
              <RowActions
                brand={b}
                onEdit={() => {
                  setEditing(b);
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

  const columns = useMemo<ColumnDef<Brand>[]>(
    () => [
      {
        id: "brand",
        accessorFn: (row) => row.name,
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          rowA.original.name.localeCompare(rowB.original.name, "es", {
            sensitivity: "base",
          }),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label="Marca"
            ariaLabelIdle="Ordenar por nombre"
            ariaLabelAsc="Ordenado de la A a la Z. Clic para invertir"
            ariaLabelDesc="Ordenado de la Z a la A. Clic para quitar orden"
          />
        ),
        meta: {
          cellClassName:
            "min-w-0 max-w-[min(28rem,50vw)] md:max-w-[min(22rem,40vw)]",
        },
        cell: ({ row }) => {
          const name = row.original.name.trim();
          return (
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-foreground">
                {name || "—"}
              </p>
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
            ariaLabelAsc="Inactivas primero. Clic para invertir"
            ariaLabelDesc="Activas primero. Clic para quitar orden"
          />
        ),
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-flex max-w-full items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
              row.original.active
                ? "border border-emerald-200/90 bg-emerald-50 text-emerald-800 dark:text-emerald-200"
                : "border border-border bg-muted text-muted-foreground",
            )}
          >
            {row.original.active ? "Activa" : "Inactiva"}
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
          const absolute = formatDateDdMmYyyyHhMm(raw);
          if (relative == null) {
            return (
              <span className="text-sm text-muted-foreground">
                {absolute}
              </span>
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
                  <span className="block font-medium">Última actualización</span>
                  <span className="mt-0.5 block text-muted-foreground">{absolute}</span>
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
            brand={row.original}
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

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        enableSorting
        searchPlaceholder="Buscar por nombre…"
        tableHeadCellClassName="!font-medium"
        tableBodyCellClassName="py-4"
        paginationButtonVariant="ghost"
        paginationClassName="border-border/50"
        getRowClassName={() =>
          "hover:bg-muted/50 transition-colors duration-150"
        }
        renderMobileRow={renderMobileRow}
        toolbarFilters={
          <div className="flex w-full min-w-0 items-center min-[1440px]:max-w-[13rem]">
            <Select<(typeof STATUS_FILTER_OPTIONS)[number], false>
              instanceId="brands-status-filter"
              inputId="brands-status-filter-input"
              aria-label="Filtrar por estado"
              isSearchable={false}
              isClearable={false}
              options={STATUS_FILTER_OPTIONS}
              value={filterValue}
              onChange={(opt) => {
                if (opt) setStatusFilter(opt.value);
              }}
              styles={appToolbarSelectStyles}
              className="w-full"
            />
          </div>
        }
        toolbarActions={
          <Button
            type="button"
            className="h-9 w-full shrink-0 min-[1440px]:w-auto"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            Nueva
          </Button>
        }
      />

      <BrandFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        brand={editing}
      />
    </div>
  );
}
