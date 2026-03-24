"use client";

import { useMemo, useState } from "react";
import type { Brand } from "@/modules/admin/brands/brands.types";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import Select, { type StylesConfig } from "react-select";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useServerAction } from "@/hooks/use-server-action";
import { deleteBrandAction } from "./actions";
import { BrandFormDialog } from "./BrandFormDialog";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { cn } from "@/utils/cn";

const STATUS_FILTER_OPTIONS = [
  { value: "all" as const, label: "Todos los estados" },
  { value: "active" as const, label: "Activas" },
  { value: "inactive" as const, label: "Inactivas" },
];

type StatusFilter = (typeof STATUS_FILTER_OPTIONS)[number]["value"];

const filterSelectStyles: StylesConfig<
  (typeof STATUS_FILTER_OPTIONS)[number],
  false
> = {
  control: (base, state) => ({
    ...base,
    minHeight: 40,
    width: "100%",
    minWidth: 0,
    borderRadius: "0.5rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "hsl(214 32% 91% / 0.9)",
    backgroundColor: "hsl(0 0% 100%)",
    boxShadow: state.isFocused
      ? "0 0 0 2px hsl(222.2 84% 56.3% / 0.3)"
      : "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    "&:hover": {
      borderColor: "hsl(214 32% 91% / 0.9)",
    },
  }),
  valueContainer: (base) => ({ ...base, padding: "0 8px" }),
  singleValue: (base) => ({
    ...base,
    color: "hsl(222.2 84% 4.9%)",
    fontSize: "0.875rem",
  }),
  input: (base) => ({ ...base, margin: 0, padding: 0 }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "hsl(215.4 16.3% 46.9%)",
    padding: "0 8px",
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "hsl(0 0% 100%)",
    border: "1px solid hsl(214 32% 91% / 0.9)",
    borderRadius: "0.5rem",
    zIndex: 50,
  }),
  option: (base, state) => ({
    ...base,
    fontSize: "0.875rem",
    padding: "8px 12px",
    backgroundColor: state.isSelected
      ? "hsl(222.2 47.4% 11.2%)"
      : state.isFocused
        ? "hsl(210 40% 96.1%)"
        : "hsl(0 0% 100%)",
    color: state.isSelected ? "hsl(210 40% 98%)" : "hsl(222.2 84% 4.9%)",
    cursor: "pointer",
  }),
};

interface Props {
  brands: Brand[];
  isLoading?: boolean;
}

function RowActions({ brand, onEdit }: { brand: Brand; onEdit: () => void }) {
  const router = useRouter();
  const { execute, isPending } = useServerAction(deleteBrandAction, {
    successMessage: "Marca eliminada",
    errorMessage: "No se pudo eliminar la marca",
    onSuccess: () => {
      router.refresh();
    },
  });

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "¿Eliminar marca?",
      html: `Vas a eliminar <strong>${brand.name}</strong>. Si hay productos asociados, la operación no se permitirá.`,
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
    execute(brand.id);
  };

  return (
    <div className="inline-flex flex-nowrap items-center justify-end gap-1.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8 shrink-0"
            onClick={onEdit}
            aria-label="Editar marca"
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Editar</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="h-8 w-8 shrink-0"
            onClick={handleDelete}
            disabled={isPending}
            aria-label="Eliminar marca"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {isPending ? "Eliminando…" : "Eliminar"}
        </TooltipContent>
      </Tooltip>
    </div>
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

  const columns = useMemo<ColumnDef<Brand>[]>(
    () => [
      { accessorKey: "name", header: "Nombre" },
      {
        accessorKey: "active",
        header: "Estado",
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-flex w-[7rem] shrink-0 items-center justify-center rounded-full px-2 py-1 text-center text-xs font-medium",
              row.original.active
                ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                : "bg-muted text-muted-foreground",
            )}
          >
            {row.original.active ? "Activa" : "Inactiva"}
          </span>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: "Última actualización",
        cell: ({ row }) => formatDateDdMmYyyyHhMm(row.original.updatedAt),
      },
      {
        id: "actions",
        meta: { align: "right" },
        header: "Acciones",
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
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          searchPlaceholder="Buscar…"
          toolbarFilters={
            <div className="w-full min-w-0 min-[1440px]:max-w-[13rem]">
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
                styles={filterSelectStyles}
                className="w-full"
              />
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
              Nueva
            </Button>
          }
        />
      </div>

      <BrandFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        brand={editing}
      />
    </TooltipProvider>
  );
}
