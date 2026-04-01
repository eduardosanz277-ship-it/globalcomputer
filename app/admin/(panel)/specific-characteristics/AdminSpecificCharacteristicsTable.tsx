"use client";

import { useCallback, useMemo, useState, type CSSProperties } from "react";
import type { GeneralCharacteristic } from "@/modules/admin/general-characteristics/general-characteristics.types";
import type { SpecificCharacteristic } from "@/modules/admin/specific-characteristics/specific-characteristics.types";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { swalSaasConfirmAsync } from "@/utils/swal-saas";
import Select from "react-select";
import { appToolbarSelectStyles } from "@/components/ui/react-select-app-styles";
import { AdminEditDeleteRowMenu } from "@/components/admin/admin-edit-delete-row-menu";
import { SortableHeader } from "@/components/admin/admin-sortable-table-header";
import { AdminTableEmptyEmDash } from "@/components/admin/admin-table-empty";
import { Filter, FilterX, ListChecks, Plus, Search } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { deleteSpecificCharacteristicAction } from "./actions";
import { SpecificCharacteristicFormDialog } from "./SpecificCharacteristicFormDialog";
import { cn } from "@/utils/cn";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { formatRelativeLastAccess } from "@/utils/formatRelativeLastAccess";
import { SpecificCharacteristicProfileCard } from "@/components/dashboard/specific-characteristic-profile-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const STATUS_FILTER_OPTIONS = [
  { value: "all" as const, label: "Todos los estados" },
  { value: "active" as const, label: "Activos" },
  { value: "inactive" as const, label: "Inactivos" },
];

type StatusFilter = (typeof STATUS_FILTER_OPTIONS)[number]["value"];
type FilterOption = { value: string; label: string };

/** Ancho del select «Todas las características» en barra escritorio (xl+): texto de referencia + margen (`ch`). */
const GENERAL_FILTER_TOOLBAR_WIDE_CH = "Todas las características".length + 7;

interface Props {
  generalCharacteristics: GeneralCharacteristic[];
  specificCharacteristics: SpecificCharacteristic[];
  isLoading?: boolean;
}

function specificSortValue(row: SpecificCharacteristic): string {
  return `${row.generalName ?? ""} ${row.name ?? ""}`.trim().toLowerCase();
}

function updatedAtSortMs(row: SpecificCharacteristic): number {
  const t = new Date(row.updatedAt).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function RowActions({
  row,
  onEdit,
}: {
  row: SpecificCharacteristic;
  onEdit: () => void;
}) {
  const router = useRouter();
  const { executeAsync, isPending } = useServerAction(
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
    await swalSaasConfirmAsync({
      title: "¿Eliminar característica específica?",
      html: `Vas a eliminar <strong>${row.name}</strong> de <strong>${row.generalName}</strong>. Si hay productos asociados, la operación no se permitirá.`,
      confirmButtonText: "Eliminar",
      variant: "destructive",
      iconType: "warning",
      preConfirm: () => executeAsync(row.id),
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

export function AdminSpecificCharacteristicsTable({
  generalCharacteristics,
  specificCharacteristics,
  isLoading = false,
}: Props) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [generalFilter, setGeneralFilter] = useState<string>("all");
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const [draftGeneral, setDraftGeneral] = useState<string>("all");
  const [draftStatus, setDraftStatus] = useState<StatusFilter>("all");
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

  const draftGeneralFilterValue =
    generalOptions.find((o) => o.value === draftGeneral) ?? generalOptions[0];

  const draftStatusFilterValue =
    STATUS_FILTER_OPTIONS.find((o) => o.value === draftStatus) ??
    STATUS_FILTER_OPTIONS[0];

  const appliedFiltersCount = useMemo(() => {
    let n = 0;
    if (generalFilter !== "all") n += 1;
    if (statusFilter !== "all") n += 1;
    return n;
  }, [generalFilter, statusFilter]);

  const openFiltersModal = () => {
    setDraftGeneral(generalFilter);
    setDraftStatus(statusFilter);
    setFiltersModalOpen(true);
  };

  const handleClearModalFilters = () => {
    setDraftGeneral("all");
    setDraftStatus("all");
  };

  const handleApplyModalFilters = () => {
    setGeneralFilter(draftGeneral);
    setStatusFilter(draftStatus);
    setFiltersModalOpen(false);
  };

  const clearToolbarFilters = useCallback(() => {
    setGeneralFilter("all");
    setStatusFilter("all");
  }, []);

  const columns = useMemo<ColumnDef<SpecificCharacteristic>[]>(
    () => [
      {
        id: "specific",
        accessorFn: (row) =>
          `${row.generalName ?? ""} ${row.name ?? ""}`.trim(),
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          specificSortValue(rowA.original).localeCompare(
            specificSortValue(rowB.original),
            "es",
            { sensitivity: "base" },
          ),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label="Valor"
            ariaLabelIdle="Ordenar por característica general y valor"
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
          const secondary = r.generalName?.trim();
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
                : "border border-border bg-muted text-muted-foreground",
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

  const renderMobileRow = useCallback((row: Row<SpecificCharacteristic>) => {
    const r = row.original;
    return (
      <li key={row.id}>
        <SpecificCharacteristicProfileCard
          name={r.name}
          generalName={r.generalName}
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
  }, []);

  const noGenerals = generalCharacteristics.length === 0;

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
            placeholder="Buscar valores"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            disabled={isLoading}
            className="h-9 w-full rounded-lg border-border/90 bg-background pl-9 pr-3 text-sm shadow-sm transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
            autoComplete="off"
            spellCheck={false}
            aria-label="Buscar por característica general o valor específico"
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
            disabled={noGenerals}
            title={
              noGenerals
                ? "Crea al menos una característica general antes de añadir valores específicos"
                : undefined
            }
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
            placeholder="Buscar por característica general o valor específico…"
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
            className="flex min-w-0 flex-1 items-center xl:box-border xl:w-[var(--toolbar-general-filter-all-w)] xl:min-w-[var(--toolbar-general-filter-all-w)] xl:max-w-[var(--toolbar-general-filter-all-w)] xl:flex-none xl:shrink-0"
            style={
              {
                ["--toolbar-general-filter-all-w" as string]: `${GENERAL_FILTER_TOOLBAR_WIDE_CH}ch`,
              } as CSSProperties
            }
          >
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
              styles={appToolbarSelectStyles}
              className="w-full min-w-0"
            />
          </div>
          <div className="flex w-full min-w-0 flex-1 items-center min-[1440px]:max-w-[13rem]">
            <Select<(typeof STATUS_FILTER_OPTIONS)[number], false>
              instanceId="specific-characteristics-status-filter"
              inputId="specific-characteristics-status-filter-input"
              aria-label="Filtrar por estado"
              isSearchable={false}
              isClearable={false}
              options={STATUS_FILTER_OPTIONS}
              value={statusFilterValue}
              onChange={(opt) => {
                if (opt) setStatusFilter(opt.value);
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
            aria-label="Limpiar filtros de característica general y estado"
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
            disabled={noGenerals}
            title={
              noGenerals
                ? "Crea al menos una característica general antes de añadir valores específicos"
                : undefined
            }
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
                  Refina por característica general y estado. Los cambios se
                  aplican al pulsar Aplicar.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="max-h-[min(52vh,20rem)] overflow-y-auto px-6 py-5">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="specific-characteristics-filter-modal-general"
                  className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                >
                  Característica general
                </Label>
                <div className="flex w-full min-w-0 items-center">
                  <Select<FilterOption, false>
                    instanceId="specific-characteristics-general-filter-modal"
                    inputId="specific-characteristics-filter-modal-general"
                    aria-label="Característica general"
                    isSearchable={false}
                    isClearable={false}
                    options={generalOptions}
                    value={draftGeneralFilterValue}
                    onChange={(opt) => {
                      if (opt) setDraftGeneral(opt.value);
                    }}
                    styles={appToolbarSelectStyles}
                    className="w-full"
                    menuPlacement="auto"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="specific-characteristics-filter-modal-status"
                  className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                >
                  Estado
                </Label>
                <div className="flex w-full min-w-0 items-center">
                  <Select<(typeof STATUS_FILTER_OPTIONS)[number], false>
                    instanceId="specific-characteristics-status-filter-modal"
                    inputId="specific-characteristics-filter-modal-status"
                    aria-label="Estado"
                    isSearchable={false}
                    isClearable={false}
                    options={STATUS_FILTER_OPTIONS}
                    value={draftStatusFilterValue}
                    onChange={(opt) => {
                      if (opt) setDraftStatus(opt.value);
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
        data={filtered}
        isLoading={isLoading}
        enableSorting
        hideToolbar
        externalGlobalFilter={globalFilter}
        onExternalGlobalFilterChange={setGlobalFilter}
        tableHeadCellClassName="!font-medium"
        tableBodyCellClassName="py-4"
        paginationButtonVariant="ghost"
        paginationClassName="border-border/50"
        getRowClassName={() =>
          "hover:bg-muted/50 transition-colors duration-150"
        }
        renderMobileRow={renderMobileRow}
      />

      {noGenerals ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <ListChecks className="h-4 w-4 shrink-0" aria-hidden />
          No hay características generales todavía. Crea una en la sección
          correspondiente para poder definir valores específicos.
        </p>
      ) : null}

      <SpecificCharacteristicFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        specificCharacteristic={editing}
        generalCharacteristics={generalCharacteristics}
      />
    </div>
  );
}
