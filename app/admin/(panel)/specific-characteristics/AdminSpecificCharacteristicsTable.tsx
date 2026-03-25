"use client";

import { useMemo, useState } from "react";
import type { GeneralCharacteristic } from "@/modules/admin/general-characteristics/general-characteristics.types";
import type { SpecificCharacteristic } from "@/modules/admin/specific-characteristics/specific-characteristics.types";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import Select, { type StylesConfig } from "react-select";
import { ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import {
  adminTableDateCell,
  adminTableOptionalString,
} from "@/components/admin/admin-table-empty";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useServerAction } from "@/hooks/use-server-action";
import { deleteSpecificCharacteristicAction } from "./actions";
import { SpecificCharacteristicFormDialog } from "./SpecificCharacteristicFormDialog";
import { cn } from "@/utils/cn";

const STATUS_FILTER_OPTIONS = [
  { value: "all" as const, label: "Todos los estados" },
  { value: "active" as const, label: "Activos" },
  { value: "inactive" as const, label: "Inactivos" },
];

type StatusFilter = (typeof STATUS_FILTER_OPTIONS)[number]["value"];
type FilterOption = { value: string; label: string };

const filterSelectStyles: StylesConfig<FilterOption, false> = {
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
  generalCharacteristics: GeneralCharacteristic[];
  specificCharacteristics: SpecificCharacteristic[];
  isLoading?: boolean;
}

function RowActions({
  row,
  onEdit,
}: {
  row: SpecificCharacteristic;
  onEdit: () => void;
}) {
  const router = useRouter();
  const { execute, isPending } = useServerAction(
    deleteSpecificCharacteristicAction,
    {
      successMessage: "Característica específica eliminada",
      errorMessage: "No se pudo eliminar la característica específica",
      onSuccess: () => {
        router.refresh();
      },
    },
  );

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "¿Eliminar característica específica?",
      html: `Vas a eliminar <strong>${row.name}</strong> de <strong>${row.generalName}</strong>. Si hay productos asociados, la operación no se permitirá.`,
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
    <div className="inline-flex flex-nowrap items-center justify-end gap-1.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8 shrink-0"
            onClick={onEdit}
            aria-label="Editar característica específica"
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
            aria-label="Eliminar característica específica"
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

export function AdminSpecificCharacteristicsTable({
  generalCharacteristics,
  specificCharacteristics,
  isLoading = false,
}: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [generalFilter, setGeneralFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SpecificCharacteristic | null>(null);

  const generalOptions = useMemo<FilterOption[]>(
    () => [
      { value: "all", label: "Todas las características" },
      ...generalCharacteristics.map((g) => ({ value: g.id, label: g.name })),
    ],
    [generalCharacteristics],
  );

  const filtered = useMemo(() => {
    let rows = specificCharacteristics;
    if (statusFilter === "active") rows = rows.filter((r) => r.active);
    else if (statusFilter === "inactive") rows = rows.filter((r) => !r.active);

    if (generalFilter !== "all") {
      rows = rows.filter((r) => r.generalId === generalFilter);
    }

    return rows;
  }, [specificCharacteristics, statusFilter, generalFilter]);

  const statusFilterValue =
    STATUS_FILTER_OPTIONS.find((o) => o.value === statusFilter) ??
    STATUS_FILTER_OPTIONS[0];

  const generalFilterValue =
    generalOptions.find((o) => o.value === generalFilter) ?? generalOptions[0];

  const columns = useMemo<ColumnDef<SpecificCharacteristic>[]>(
    () => [
      {
        accessorKey: "generalName",
        header: "Característica general",
        cell: ({ row }) => adminTableOptionalString(row.original.generalName),
      },
      {
        accessorKey: "name",
        header: "Valor específico",
        cell: ({ row }) => adminTableOptionalString(row.original.name),
      },
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
            {row.original.active ? "Activo" : "Inactivo"}
          </span>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: "Última actualización",
        cell: ({ row }) => adminTableDateCell(row.original.updatedAt),
      },
      {
        id: "actions",
        meta: { align: "right" },
        header: "Acciones",
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

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          toolbarLayout="stacked"
          searchPlaceholder="Buscar…"
          toolbarFilters={
            <div className="flex w-full min-w-0 flex-col gap-2 lg:flex-row lg:flex-nowrap lg:gap-2">
              <div className="min-w-0 w-full lg:flex-1 lg:min-w-0 min-[1440px]:max-w-[13rem] min-[1440px]:flex-none">
                <Select<FilterOption, false>
                  instanceId="specific-characteristics-general-filter"
                  inputId="specific-characteristics-general-filter-input"
                  aria-label="Filtrar por característica general"
                  isSearchable={false}
                  isClearable={false}
                  options={generalOptions}
                  value={generalFilterValue}
                  onChange={(opt) => {
                    if (opt) setGeneralFilter(opt.value);
                  }}
                  styles={filterSelectStyles}
                  className="w-full"
                />
              </div>

              <div className="min-w-0 w-full lg:flex-1 lg:min-w-0 min-[1440px]:max-w-[13rem] min-[1440px]:flex-none">
                <Select<FilterOption, false>
                  instanceId="specific-characteristics-status-filter"
                  inputId="specific-characteristics-status-filter-input"
                  aria-label="Filtrar por estado"
                  isSearchable={false}
                  isClearable={false}
                  options={STATUS_FILTER_OPTIONS}
                  value={statusFilterValue}
                  onChange={(opt) => {
                    if (opt) setStatusFilter(opt.value as StatusFilter);
                  }}
                  styles={filterSelectStyles}
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
              disabled={generalCharacteristics.length === 0}
              title={
                generalCharacteristics.length === 0
                  ? "Crea al menos una característica general antes de añadir valores específicos"
                  : undefined
              }
            >
              <Plus className="mr-2 h-4 w-4" aria-hidden />
              Nueva
            </Button>
          }
        />

        {generalCharacteristics.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <ListChecks className="h-4 w-4 shrink-0" aria-hidden />
            No hay características generales todavía. Crea una en la sección
            correspondiente para poder definir valores específicos.
          </p>
        ) : null}
      </div>

      <SpecificCharacteristicFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        specificCharacteristic={editing}
        generalCharacteristics={generalCharacteristics}
      />
    </TooltipProvider>
  );
}
