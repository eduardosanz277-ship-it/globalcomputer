"use client";

import { useCallback, useMemo, useState } from "react";
import type { GeneralCharacteristic } from "@/modules/admin/general-characteristics/general-characteristics.types";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import Select from "react-select";
import { appSelectStyles } from "@/components/ui/react-select-app-styles";
import { AdminEditDeleteRowMenu } from "@/components/admin/admin-edit-delete-row-menu";
import { SortableHeader } from "@/components/admin/admin-sortable-table-header";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useServerAction } from "@/hooks/use-server-action";
import { deleteGeneralCharacteristicAction } from "./actions";
import { GeneralCharacteristicFormDialog } from "./GeneralCharacteristicFormDialog";
import { cn } from "@/utils/cn";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { formatRelativeLastAccess } from "@/utils/formatRelativeLastAccess";
import { GeneralCharacteristicProfileCard } from "@/components/dashboard/general-characteristic-profile-card";
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
  characteristics: GeneralCharacteristic[];
  isLoading?: boolean;
}

function updatedAtSortMs(row: GeneralCharacteristic): number {
  const t = new Date(row.updatedAt).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function RowActions({
  row,
  onEdit,
}: {
  row: GeneralCharacteristic;
  onEdit: () => void;
}) {
  const router = useRouter();
  const { execute, isPending } = useServerAction(
    deleteGeneralCharacteristicAction,
    {
      successMessage: "Característica eliminada",
      errorMessage: "No se pudo eliminar la característica",
      onSuccess: () => {
        router.refresh();
      },
    },
  );

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "¿Eliminar característica?",
      html: `Vas a eliminar <strong>${row.name}</strong>. Se borrarán también los valores específicos asociados si la base de datos lo permite; si hay productos vinculados, puede no permitirse.`,
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

export function AdminGeneralCharacteristicsTable({
  characteristics,
  isLoading = false,
}: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GeneralCharacteristic | null>(null);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return characteristics;
    if (statusFilter === "active") {
      return characteristics.filter((c) => c.active);
    }
    return characteristics.filter((c) => !c.active);
  }, [characteristics, statusFilter]);

  const filterValue =
    STATUS_FILTER_OPTIONS.find((o) => o.value === statusFilter) ??
    STATUS_FILTER_OPTIONS[0];

  const columns = useMemo<ColumnDef<GeneralCharacteristic>[]>(
    () => [
      {
        id: "name",
        accessorFn: (row) => row.name,
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          rowA.original.name.localeCompare(rowB.original.name, "es", {
            sensitivity: "base",
          }),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label="Nombre"
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
                : "border border-slate-200/90 bg-slate-100 text-slate-700",
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
    (row: Row<GeneralCharacteristic>) => {
      const r = row.original;
      return (
        <li key={row.id}>
          <GeneralCharacteristicProfileCard
            name={r.name}
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
          <div className="w-full min-w-0 min-[1440px]:max-w-[13rem]">
            <Select<(typeof STATUS_FILTER_OPTIONS)[number], false>
              instanceId="general-characteristics-status-filter"
              inputId="general-characteristics-status-filter-input"
              aria-label="Filtrar por estado"
              isSearchable={false}
              isClearable={false}
              options={STATUS_FILTER_OPTIONS}
              value={filterValue}
              onChange={(opt) => {
                if (opt) setStatusFilter(opt.value);
              }}
              styles={appSelectStyles}
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

      <GeneralCharacteristicFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        characteristic={editing}
      />
    </div>
  );
}
