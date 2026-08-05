"use client";

import {
  useId,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type FilterFn,
  type Row,
  type SortingState,
} from "@tanstack/react-table";
import Select from "react-select";
import { appToolbarSelectStyles } from "@/components/ui/react-select-app-styles";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Search,
} from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/utils/cn";
import { Button } from "./button";
import { EmptyState } from "./empty-state";
import { Input } from "./input";

type PageSizeOption = { value: number; label: string };

/** Meta opcional en `ColumnDef` para alinear celdas y añadir clases a `th`/`td`. */
export type DataTableColumnMeta = {
  align?: "left" | "right" | "center";
  /** Se fusiona en `th` y `td` de la columna (p. ej. anchos responsivos). */
  cellClassName?: string;
};

/**
 * Ids de columna cuya primera celda en vista **card** (`md:hidden`) comparte
 * bloque con el menú de acciones (etiqueta + valor con el mismo `gap-1` que el
 * resto de campos; acciones a la derecha).
 */
const CARD_PRIMARY_COLUMN_IDS = new Set([
  "user",
  "business",
  "brand",
  "type",
  "name",
  "specific",
  "service",
  "minAmount",
]);

function cellAlignClasses(meta: DataTableColumnMeta | undefined) {
  const align = meta?.align;
  if (align === "right") {
    return "text-right whitespace-nowrap pl-8 md:pl-12 w-[1%] min-w-[8.5rem]";
  }
  if (align === "center") {
    return "text-center";
  }
  return "text-left";
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  className?: string;
  /** Opciones de filas por página (ej. [5, 10, 25, 50]) */
  pageSizeOptions?: number[];
  /** Tamaño inicial de página */
  defaultPageSize?: number;
  /** Texto del placeholder del buscador */
  searchPlaceholder?: string;
  /**
   * Clases extra en el contenedor del campo de búsqueda (p. ej. `max-w-sm` para alinear
   * con tablas admin que llevan filtros en la misma barra).
   */
  toolbarSearchClassName?: string;
  /** Clases extra en el `<Input>` del buscador (p. ej. `bg-white` alineado al `react-select` del toolbar). */
  toolbarSearchInputClassName?: string;
  /** Filtros u otros controles a la derecha del buscador (misma fila en escritorio) */
  toolbarFilters?: ReactNode;
  /** Acciones alineadas a la derecha (ej. “Nueva …”) */
  toolbarActions?: ReactNode;
  /**
   * `stacked`: una fila buscar, otra filtros (p. ej. dos columnas), otra acciones.
   * Útil cuando hay varios filtros y se quiere orden vertical claro.
   * En `default`, con filtros: desde `min-[1440px]` el orden es buscar → filtros → acciones.
   * Solo buscar + acciones: desde `md` siempre en la misma fila.
   * En `stacked`, búsqueda y bloques siguientes pasan a una fila desde `min-[1440px]`.
   */
  toolbarLayout?: "default" | "stacked";
  /**
   * Cuando se provee, el DataTable usa este valor como filtro global en lugar del
   * estado interno. El toolbar integrado (buscador) se oculta automáticamente para
   * que el padre pueda renderizar su propio campo de búsqueda.
   */
  externalGlobalFilter?: string;
  /** Llamado cuando cambia el filtro global (solo relevante con `externalGlobalFilter`). */
  onExternalGlobalFilterChange?: (value: string) => void;
  /** Si es `true`, suprime completamente el toolbar integrado (útil con toolbar custom). */
  hideToolbar?: boolean;
  /** Clases extra del elemento `<table>` (p. ej. `table-fixed` para truncar columnas). */
  tableClassName?: string;
  /** Muestra un spinner en el cuerpo de la tabla y deshabilita filtros/paginación */
  isLoading?: boolean;
  /** Clases extra en cada `th` (p. ej. `font-medium`). */
  tableHeadCellClassName?: string;
  /** Clases extra en cada `td` del cuerpo (p. ej. `py-4`). */
  tableBodyCellClassName?: string;
  /** Clases del bloque de paginación inferior. */
  paginationClassName?: string;
  /** Variante de los botones de página (por defecto `outline`). */
  paginationButtonVariant?: "outline" | "ghost";
  /**
   * Activa ordenación de columnas (`getSortedRowModel`).
   * Las columnas ordenables deben marcar `enableSorting: true`; el resto hereda `enableSorting: false`.
   */
  enableSorting?: boolean;
  /** Ordenación inicial (p. ej. `[{ id: "minAmount", desc: false }]`). */
  defaultSorting?: SortingState;
  /** Título del empty state cuando no hay filas en `data`. */
  emptyTitle?: string;
  /** Descripción opcional del empty state sin datos. */
  emptyDescription?: string;
  /** Título cuando hay datos pero el filtro no coincide. */
  emptyNoMatchTitle?: string;
  /** Clases por fila (p. ej. fondo según estado). Si no se pasa, se usa hover por defecto. */
  getRowClassName?: (row: TData) => string | undefined;
  /** Handler opcional para hacer clickeable cada fila. */
  onRowClick?: (row: TData) => void;
  /**
   * Si se define, sustituye el `<article>` por fila en vista móvil (`md:hidden`).
   * Debe devolver el `<li>` completo (con `key`). Útil para tarjetas personalizadas (p. ej. `UserProfileCard`).
   */
  renderMobileRow?: (row: Row<TData>) => ReactNode;
}

/** Busca en los valores de las celdas; ignora columnas con id `actions`. */
const globalFilterFn: FilterFn<any> = (row, _columnId, filterValue) => {
  const q = String(filterValue ?? "")
    .trim()
    .toLowerCase();
  if (!q) return true;
  return row.getAllCells().some((cell) => {
    if (cell.column.id === "actions") return false;
    const val = cell.getValue();
    if (val == null) return false;
    return String(val).toLowerCase().includes(q);
  });
};

export function DataTable<TData, TValue>({
  columns,
  data,
  className,
  pageSizeOptions = [5, 10, 20, 50],
  defaultPageSize = 10,
  searchPlaceholder = "Buscar…",
  toolbarSearchClassName,
  toolbarSearchInputClassName,
  toolbarFilters,
  toolbarActions,
  toolbarLayout = "default",
  externalGlobalFilter,
  onExternalGlobalFilterChange,
  hideToolbar = false,
  tableClassName,
  isLoading = false,
  tableHeadCellClassName,
  tableBodyCellClassName,
  paginationClassName,
  paginationButtonVariant = "outline",
  enableSorting = false,
  defaultSorting = [],
  emptyTitle = "No hay datos disponibles.",
  emptyDescription,
  emptyNoMatchTitle = "Sin coincidencias con la búsqueda.",
  getRowClassName,
  onRowClick,
  renderMobileRow,
}: DataTableProps<TData, TValue>) {
  const { t } = useI18n();
  const pageSizeSelectId = useId();
  const [internalGlobalFilter, setInternalGlobalFilter] = useState("");
  const globalFilter =
    externalGlobalFilter !== undefined
      ? externalGlobalFilter
      : internalGlobalFilter;
  const setGlobalFilter = (value: string) => {
    if (externalGlobalFilter === undefined) setInternalGlobalFilter(value);
    onExternalGlobalFilterChange?.(value);
  };
  const [sorting, setSorting] = useState<SortingState>(defaultSorting);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });

  const mergedPageSizeOptions = useMemo(() => {
    return [...new Set([...pageSizeOptions, defaultPageSize])].sort(
      (a, b) => a - b,
    );
  }, [pageSizeOptions, defaultPageSize]);

  const pageSizeSelectOptions = useMemo<PageSizeOption[]>(
    () =>
      mergedPageSizeOptions.map((size) => ({
        value: size,
        label: String(size),
      })),
    [mergedPageSizeOptions],
  );

  const pageSizeValue =
    pageSizeSelectOptions.find((o) => o.value === pagination.pageSize) ??
    pageSizeSelectOptions[0] ??
    null;

  const table = useReactTable({
    data: isLoading ? [] : data,
    columns,
    defaultColumn: enableSorting ? { enableSorting: false } : undefined,
    state: {
      globalFilter,
      pagination,
      ...(enableSorting ? { sorting } : {}),
    },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    ...(enableSorting
      ? {
          onSortingChange: (updater: SetStateAction<SortingState>) => {
            setSorting(updater);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          },
        }
      : {}),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(enableSorting ? { getSortedRowModel: getSortedRowModel() } : {}),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn,
  });

  const filteredCount = table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();
  const totalPages = pageCount || 1;
  const { pageIndex, pageSize } = pagination;
  const startRow = filteredCount === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, filteredCount);

  const firstHeaderGroup = table.getHeaderGroups()[0];

  const stackedWide = {
    toolbarRow:
      "min-[1440px]:flex-row min-[1440px]:flex-nowrap min-[1440px]:items-center min-[1440px]:gap-3 min-[1440px]:justify-start",
    search: "min-[1440px]:max-w-sm",
    filters: "min-[1440px]:min-w-0 min-[1440px]:flex-1",
    actions:
      "min-[1440px]:ml-auto min-[1440px]:w-auto min-[1440px]:shrink-0 min-[1440px]:flex-row min-[1440px]:items-center",
  };

  /** Solo buscar + acciones (sin filtros): desde tablet, misma fila que el buscador (p. ej. Servicios). */
  const toolbarSearchActionsOnly =
    toolbarLayout === "default" && Boolean(toolbarActions) && !toolbarFilters;

  const searchInput = (
    <>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        placeholder={searchPlaceholder}
        value={String(globalFilter ?? "")}
        onChange={(e) => table.setGlobalFilter(e.target.value)}
        disabled={isLoading}
        className={cn(
          "h-9 w-full rounded-lg border-border/90 bg-background pl-9 pr-3",
          "text-sm shadow-sm transition-[box-shadow,border-color]",
          "placeholder:text-muted-foreground/70",
          "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25",
          isLoading && "cursor-not-allowed opacity-60",
          toolbarSearchInputClassName,
        )}
        type="search"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        aria-label="Filtrar filas de la tabla"
      />
    </>
  );

  const handleRowClick = (event: MouseEvent<HTMLElement>, rowData: TData) => {
    if (!onRowClick) return;
    const target = event.target as HTMLElement | null;
    if (
      target?.closest(
        "button, a, input, textarea, select, [role='button'], [role='menuitem']",
      )
    ) {
      return;
    }
    onRowClick(rowData);
  };

  return (
    <div className={cn("w-full min-w-0 space-y-4", className)}>
      {!hideToolbar && toolbarLayout === "stacked" ? (
        <div
          className={cn(
            "data-table-toolbar data-table-toolbar--stacked flex min-w-0 flex-col gap-3",
            stackedWide.toolbarRow,
          )}
        >
          <div
            className={cn(
              "data-table-toolbar__search relative flex w-full min-w-0 max-w-full shrink-0 items-center",
              stackedWide.search,
              toolbarSearchClassName,
            )}
          >
            {searchInput}
          </div>
          {toolbarFilters ? (
            <div
              className={cn(
                "data-table-toolbar__filters relative flex w-full min-w-0 max-w-full items-center",
                stackedWide.filters,
              )}
            >
              {toolbarFilters}
            </div>
          ) : null}
          {toolbarActions ? (
            <div
              className={cn(
                "data-table-toolbar__actions flex w-full min-w-0 shrink-0 flex-col items-stretch gap-2",
                stackedWide.actions,
              )}
            >
              {toolbarActions}
            </div>
          ) : null}
        </div>
      ) : !hideToolbar ? (
        <div
          className={cn(
            "data-table-toolbar flex min-w-0 flex-col gap-3",
            toolbarSearchActionsOnly &&
              "data-table-toolbar--search-actions md:flex-row md:flex-nowrap md:items-center md:gap-3",
            /* ≥1440px: [Buscar][filtros…][acciones al final]; el wrapper intermedio usa `contents` */
            !toolbarSearchActionsOnly &&
              "min-[1440px]:flex-row min-[1440px]:flex-nowrap min-[1440px]:items-center min-[1440px]:gap-3",
          )}
        >
          <div
            className={cn(
              "data-table-toolbar__search relative flex w-full min-w-0 max-w-full shrink-0 items-center",
              toolbarSearchActionsOnly && "md:min-w-0 md:flex-1",
              !toolbarSearchActionsOnly &&
                "min-[1440px]:max-w-sm min-[1440px]:shrink-0",
              toolbarSearchActionsOnly &&
                "md:max-w-none min-[1440px]:max-w-sm min-[1440px]:flex-none min-[1440px]:shrink-0",
              toolbarSearchClassName,
            )}
          >
            {searchInput}
          </div>
          {toolbarFilters || toolbarActions ? (
            <div
              className={cn(
                "flex w-full min-w-0 flex-col gap-2",
                toolbarSearchActionsOnly
                  ? "md:w-auto md:shrink-0"
                  : "md:max-[1439px]:flex-row md:max-[1439px]:items-center md:max-[1439px]:gap-3",
                /* ≥1440px: los hijos (filtros, acciones) pasan al flex del toolbar */
                "min-[1440px]:contents",
              )}
            >
              {toolbarFilters ? (
                <div
                  className={cn(
                    "data-table-toolbar__filters relative flex w-full min-w-0 max-w-full items-center",
                    "md:max-[1439px]:min-w-0 md:max-[1439px]:flex-1",
                    "min-[1440px]:w-auto min-[1440px]:max-w-none min-[1440px]:shrink-0",
                  )}
                >
                  {toolbarFilters}
                </div>
              ) : null}
              {toolbarActions ? (
                <div
                  className={cn(
                    "data-table-toolbar__actions flex w-full min-w-0 shrink-0 flex-col items-stretch gap-2",
                    toolbarSearchActionsOnly
                      ? "md:w-auto md:flex-row md:items-center md:justify-end min-[1440px]:ml-auto"
                      : "md:max-[1439px]:w-auto md:max-[1439px]:flex-row md:max-[1439px]:items-center md:max-[1439px]:justify-end min-[1440px]:ml-auto min-[1440px]:w-auto min-[1440px]:shrink-0 min-[1440px]:flex-row min-[1440px]:items-center min-[1440px]:justify-end",
                  )}
                >
                  {toolbarActions}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          "min-w-0 overflow-hidden rounded-xl border border-border bg-card",
        )}
        role="region"
        aria-label="Resultados de la tabla"
        aria-busy={isLoading}
      >
        {/* Vista tabla: desktop / tablet (scroll horizontal si el área es estrecha) */}
        <div className="hidden min-w-0 overflow-x-auto overscroll-x-contain md:block">
          <table
            className={cn(
              "w-full min-w-[640px] border-collapse text-sm",
              tableClassName,
            )}
          >
            <thead className="sticky top-0 z-[1] border-b border-border bg-muted">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      scope="col"
                      className={cn(
                        "whitespace-nowrap px-4 py-3",
                        "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                        tableHeadCellClassName,
                        "first:pl-5 last:pr-5",
                        cellAlignClasses(
                          header.column.columnDef.meta as
                            | DataTableColumnMeta
                            | undefined,
                        ),
                        (
                          header.column.columnDef.meta as
                            | DataTableColumnMeta
                            | undefined
                        )?.cellClassName,
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-0">
                    <div
                      className="flex min-h-[220px] flex-col items-center justify-center gap-3 py-12"
                      role="status"
                      aria-live="polite"
                    >
                      <Loader2
                        className="h-9 w-9 animate-spin text-muted-foreground"
                        aria-hidden
                      />
                      <span className="sr-only">
                        Cargando datos de la tabla
                      </span>
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "transition-colors duration-150",
                      onRowClick && "cursor-pointer",
                      getRowClassName?.(row.original) ?? "hover:bg-muted/45",
                    )}
                    onClick={(event) => handleRowClick(event, row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(
                          "px-4 py-3 align-middle text-foreground first:pl-5 last:pr-5",
                          tableBodyCellClassName,
                          cellAlignClasses(
                            cell.column.columnDef.meta as
                              | DataTableColumnMeta
                              | undefined,
                          ),
                          (
                            cell.column.columnDef.meta as
                              | DataTableColumnMeta
                              | undefined
                          )?.cellClassName,
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-0">
                    <EmptyState
                      variant={data.length === 0 ? "no-data" : "no-match"}
                      title={
                        data.length === 0 ? emptyTitle : emptyNoMatchTitle
                      }
                      description={
                        data.length === 0 ? emptyDescription : undefined
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Vista tarjetas: móvil / tablet pequeña */}
        <div className="md:hidden">
          {isLoading ? (
            <div
              className="flex min-h-[220px] flex-col items-center justify-center gap-3 px-4 py-12"
              role="status"
              aria-live="polite"
            >
              <Loader2
                className="h-9 w-9 animate-spin text-muted-foreground"
                aria-hidden
              />
              <span className="sr-only">Cargando datos de la tabla</span>
            </div>
          ) : table.getRowModel().rows.length ? (
            <ul className="space-y-3 p-3 sm:p-4">
              {table.getRowModel().rows.map((row) =>
                renderMobileRow ? (
                  renderMobileRow(row)
                ) : (
                  <li key={row.id}>
                    <article
                      className={cn(
                        "overflow-hidden rounded-xl border border-border bg-card",
                        getRowClassName?.(row.original),
                      )}
                    >
                      {(() => {
                        const visibleCells = row.getVisibleCells();
                        const actionCell = visibleCells.find(
                          (c) => c.column.id === "actions",
                        );
                        const bodyCells = visibleCells.filter(
                          (c) => c.column.id !== "actions",
                        );
                        const primaryCell = bodyCells.find((c) =>
                          CARD_PRIMARY_COLUMN_IDS.has(c.column.id),
                        );
                        const restBodyCells = bodyCells.filter(
                          (c) => c.column.id !== primaryCell?.column.id,
                        );

                        const renderFieldRow = (
                          cell: (typeof bodyCells)[0],
                        ) => {
                          const header = firstHeaderGroup?.headers.find(
                            (h) => h.column.id === cell.column.id,
                          );
                          if (!header || header.isPlaceholder) return null;
                          return (
                            <div
                              key={cell.id}
                              className="flex flex-col gap-1 px-4 py-3 sm:px-5"
                            >
                              <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                              </span>
                              <div className="min-w-0 text-sm text-foreground">
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext(),
                                )}
                              </div>
                            </div>
                          );
                        };

                        if (actionCell && primaryCell) {
                          const primaryHeader = firstHeaderGroup?.headers.find(
                            (h) => h.column.id === primaryCell.column.id,
                          );
                          return (
                            <div className="divide-y divide-border/70">
                              <div className="flex items-start justify-between gap-3 px-4 py-3 sm:px-5">
                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                  <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                                    {primaryHeader &&
                                    !primaryHeader.isPlaceholder
                                      ? flexRender(
                                          primaryHeader.column.columnDef
                                            .header,
                                          primaryHeader.getContext(),
                                        )
                                      : null}
                                  </span>
                                  <div className="min-w-0 text-sm text-foreground">
                                    {flexRender(
                                      primaryCell.column.columnDef.cell,
                                      primaryCell.getContext(),
                                    )}
                                  </div>
                                </div>
                                <div className="shrink-0 self-start">
                                  {flexRender(
                                    actionCell.column.columnDef.cell,
                                    actionCell.getContext(),
                                  )}
                                </div>
                              </div>
                              {restBodyCells.map((cell) =>
                                renderFieldRow(cell),
                              )}
                            </div>
                          );
                        }

                        return (
                          <>
                            {actionCell ? (
                              <div className="flex items-start justify-end border-b border-border/70 px-3 py-2 sm:px-4">
                                <div className="flex min-w-0 justify-end">
                                  {flexRender(
                                    actionCell.column.columnDef.cell,
                                    actionCell.getContext(),
                                  )}
                                </div>
                              </div>
                            ) : null}
                            <div className="divide-y divide-border/70">
                              {bodyCells.map((cell) => renderFieldRow(cell))}
                            </div>
                          </>
                        );
                      })()}
                    </article>
                  </li>
                ),
              )}
            </ul>
          ) : (
            <div className="px-4 py-0">
              <EmptyState
                variant={data.length === 0 ? "no-data" : "no-match"}
                title={data.length === 0 ? emptyTitle : emptyNoMatchTitle}
                description={
                  data.length === 0 ? emptyDescription : undefined
                }
              />
            </div>
          )}
        </div>
      </div>

      <nav
        className={cn("border-t border-border pt-4", paginationClassName)}
        aria-label={t("tablePagination.navAriaLabel")}
      >
        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between xl:gap-6">
          <p
            role="status"
            className="min-w-0 text-sm leading-relaxed text-muted-foreground"
          >
            {isLoading ? (
              t("tablePagination.loadingData")
            ) : filteredCount === 0 ? (
              t("tablePagination.noResults")
            ) : (
              <>
                {t("tablePagination.showing")}{" "}
                <span className="tabular-nums font-medium text-foreground">
                  {startRow}–{endRow}
                </span>{" "}
                {t("tablePagination.of")}{" "}
                <span className="tabular-nums font-medium text-foreground">
                  {filteredCount}
                </span>{" "}
                {filteredCount === 1
                  ? t("tablePagination.resultSingular")
                  : t("tablePagination.resultPlural")}
                <span className="mx-1.5 text-muted-foreground/70">·</span>
                {t("tablePagination.pageWord")}{" "}
                <span className="tabular-nums font-medium text-foreground">
                  {pageIndex + 1}
                </span>{" "}
                {t("tablePagination.of")}{" "}
                <span className="tabular-nums font-medium text-foreground">
                  {totalPages}
                </span>
              </>
            )}
          </p>

          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-x-6 sm:gap-y-3 xl:shrink-0">
            <div
              className="flex items-center gap-2"
              role="group"
              aria-labelledby={`${pageSizeSelectId}-label`}
            >
              <label
                id={`${pageSizeSelectId}-label`}
                htmlFor={`${pageSizeSelectId}-input`}
                className="whitespace-nowrap text-sm text-muted-foreground"
              >
                {t("tablePagination.rowsPerPageLabel")}
              </label>
              <Select<PageSizeOption, false>
                instanceId={pageSizeSelectId}
                inputId={`${pageSizeSelectId}-input`}
                aria-labelledby={`${pageSizeSelectId}-label`}
                isSearchable={false}
                isClearable={false}
                isDisabled={isLoading}
                options={pageSizeSelectOptions}
                value={pageSizeValue}
                menuPlacement="top"
                components={{
                  DropdownIndicator: null,
                  IndicatorSeparator: null,
                }}
                onChange={(opt) => {
                  if (opt) table.setPageSize(opt.value);
                }}
                styles={{
                  ...appToolbarSelectStyles,
                  control: (base, state) => ({
                    ...(typeof appToolbarSelectStyles.control === "function"
                      ? appToolbarSelectStyles.control(base, state)
                      : base),
                    cursor: "pointer",
                  }),
                  valueContainer: (base, props) => ({
                    ...(typeof appToolbarSelectStyles.valueContainer ===
                    "function"
                      ? appToolbarSelectStyles.valueContainer(base, props)
                      : base),
                    cursor: "pointer",
                  }),
                  singleValue: (base, props) => ({
                    ...(typeof appToolbarSelectStyles.singleValue === "function"
                      ? appToolbarSelectStyles.singleValue(base, props)
                      : base),
                    cursor: "pointer",
                  }),
                }}
                className="min-w-[50px] shrink-0"
              />
            </div>

            <div
              className="flex items-center gap-1"
              role="group"
              aria-label={t("tablePagination.pageButtonsGroupAria")}
            >
              <Button
                type="button"
                variant={paginationButtonVariant}
                size="icon"
                className="min-h-9 min-w-9 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => table.setPageIndex(0)}
                disabled={isLoading || !table.getCanPreviousPage()}
                aria-label={t("tablePagination.firstPageAria")}
                title={t("tablePagination.firstPageTitle")}
              >
                <ChevronsLeft className="h-4 w-4" aria-hidden />
              </Button>
              <Button
                type="button"
                variant={paginationButtonVariant}
                size="icon"
                className="min-h-9 min-w-9 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => table.previousPage()}
                disabled={isLoading || !table.getCanPreviousPage()}
                aria-label={t("tablePagination.previousPageAria")}
                title={t("tablePagination.previousPageTitle")}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </Button>
              <Button
                type="button"
                variant={paginationButtonVariant}
                size="icon"
                className="min-h-9 min-w-9 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => table.nextPage()}
                disabled={isLoading || !table.getCanNextPage()}
                aria-label={t("tablePagination.nextPageAria")}
                title={t("tablePagination.nextPageTitle")}
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
              <Button
                type="button"
                variant={paginationButtonVariant}
                size="icon"
                className="min-h-9 min-w-9 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => table.setPageIndex(Math.max(0, pageCount - 1))}
                disabled={isLoading || !table.getCanNextPage()}
                aria-label={t("tablePagination.lastPageAria")}
                title={t("tablePagination.lastPageTitle")}
              >
                <ChevronsRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
