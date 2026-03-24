"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type FilterFn,
} from "@tanstack/react-table";
import Select, { type StylesConfig } from "react-select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Search,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "./button";
import { Input } from "./input";

type PageSizeOption = { value: number; label: string };

/** Meta opcional en `ColumnDef` para alinear celdas y añadir clases a `th`/`td`. */
export type DataTableColumnMeta = {
  align?: "left" | "right" | "center";
  /** Se fusiona en `th` y `td` de la columna (p. ej. anchos responsivos). */
  cellClassName?: string;
};

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

const pageSizeSelectStyles: StylesConfig<PageSizeOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 28,
    minWidth: 62,
    borderColor: "hsl(214 32% 91%)",
    backgroundColor: "hsl(0 0% 100%)",
    boxShadow: state.isFocused
      ? "0 0 0 2px hsl(222.2 84% 56.3% / 0.2)"
      : "none",
    "&:hover": { borderColor: "hsl(214 32% 91%)" },
  }),
  valueContainer: (base) => ({ ...base, padding: "0 6px" }),
  singleValue: (base) => ({
    ...base,
    color: "hsl(222.2 84% 4.9%)",
    fontSize: "0.75rem",
    lineHeight: 1.2,
  }),
  input: (base) => ({ ...base, margin: 0, padding: 0 }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "hsl(215.4 16.3% 46.9%)",
    padding: "0 4px",
    "& svg": { height: 14, width: 14 },
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "hsl(0 0% 100%)",
    border: "1px solid hsl(214 32% 91%)",
    borderRadius: "0.25rem",
    boxShadow:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    zIndex: 50,
  }),
  option: (base, state) => ({
    ...base,
    fontSize: "0.75rem",
    padding: "4px 8px",
    backgroundColor: state.isSelected
      ? "hsl(222.2 47.4% 11.2%)"
      : state.isFocused
        ? "hsl(210 40% 96.1%)"
        : "hsl(0 0% 100%)",
    color: state.isSelected ? "hsl(210 40% 98%)" : "hsl(222.2 84% 4.9%)",
    cursor: "pointer",
    "&:active": {
      backgroundColor: state.isSelected
        ? "hsl(222.2 47.4% 11.2%)"
        : "hsl(210 40% 96.1%)",
    },
  }),
};

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
  /** Filtros u otros controles a la derecha del buscador (misma fila en escritorio) */
  toolbarFilters?: ReactNode;
  /** Acciones alineadas a la derecha (ej. “Nueva …”) */
  toolbarActions?: ReactNode;
  /**
   * `stacked`: una fila buscar, otra filtros (p. ej. dos columnas), otra acciones.
   * Útil cuando hay varios filtros y se quiere orden vertical claro.
   * En ambos modos, búsqueda y acciones pasan a una sola fila desde `min-[1440px]`.
   */
  toolbarLayout?: "default" | "stacked";
  /** Clases extra del elemento `<table>` (p. ej. `table-fixed` para truncar columnas). */
  tableClassName?: string;
  /** Muestra un spinner en el cuerpo de la tabla y deshabilita filtros/paginación */
  isLoading?: boolean;
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
  toolbarFilters,
  toolbarActions,
  toolbarLayout = "default",
  tableClassName,
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  const pageSizeSelectId = useId();
  const [globalFilter, setGlobalFilter] = useState("");
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
    state: {
      globalFilter,
      pagination,
    },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
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
          "h-10 w-full rounded-lg border-border/90 bg-background pl-9 pr-3",
          "text-sm shadow-sm transition-[box-shadow,border-color]",
          "placeholder:text-muted-foreground/70",
          "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25",
          isLoading && "cursor-not-allowed opacity-60",
        )}
        type="search"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        aria-label="Filtrar filas de la tabla"
      />
    </>
  );

  return (
    <div className={cn("w-full min-w-0 space-y-4", className)}>
      {toolbarLayout === "stacked" ? (
        <div
          className={cn(
            "data-table-toolbar data-table-toolbar--stacked flex min-w-0 flex-col gap-3",
            stackedWide.toolbarRow,
          )}
        >
          <div
            className={cn(
              "data-table-toolbar__search relative w-full min-w-0 max-w-full shrink-0",
              stackedWide.search,
            )}
          >
            {searchInput}
          </div>
          {toolbarFilters ? (
            <div
              className={cn(
                "data-table-toolbar__filters relative w-full min-w-0 max-w-full",
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
      ) : (
        <div
          className={cn(
            "data-table-toolbar flex min-w-0 flex-col gap-3",
            "min-[1440px]:flex-row min-[1440px]:items-center min-[1440px]:justify-between min-[1440px]:gap-4",
          )}
        >
          <div
            className={cn(
              "data-table-toolbar__main flex min-w-0 flex-1 flex-col gap-3",
              "min-[1440px]:flex-row min-[1440px]:items-stretch min-[1440px]:gap-3",
            )}
          >
            <div className="data-table-toolbar__search relative w-full min-w-0 max-w-full shrink-0 min-[1440px]:max-w-sm">
              {searchInput}
            </div>
            {toolbarFilters ? (
              <div className="data-table-toolbar__filters relative w-full min-w-0 max-w-full shrink-0 min-[1440px]:max-w-sm">
                {toolbarFilters}
              </div>
            ) : null}
          </div>
          {toolbarActions ? (
            <div className="data-table-toolbar__actions flex w-full min-w-0 shrink-0 flex-col items-end gap-2 min-[1440px]:flex-row min-[1440px]:w-auto min-[1440px]:items-center min-[1440px]:justify-end">
              {toolbarActions}
            </div>
          ) : null}
        </div>
      )}

      <div
        className={cn(
          "min-w-0 overflow-hidden rounded-xl border border-border/90 bg-card",
          "shadow-sm ring-1 ring-border/40",
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
            <thead className="sticky top-0 z-[1] border-b border-border bg-muted/90 backdrop-blur-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      scope="col"
                      className={cn(
                        "whitespace-nowrap px-4 py-3",
                        "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
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
            <tbody className="divide-y divide-border/80 bg-card">
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
                    className="transition-colors duration-150 hover:bg-muted/45"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(
                          "px-4 py-3 align-middle text-foreground first:pl-5 last:pr-5",
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
                  <td
                    colSpan={columns.length}
                    className="px-4 py-14 text-center text-sm text-muted-foreground"
                  >
                    {data.length === 0
                      ? "Sin datos"
                      : "Sin coincidencias con la búsqueda."}
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
              {table.getRowModel().rows.map((row) => (
                <li key={row.id}>
                  <article
                    className={cn(
                      "overflow-hidden rounded-xl border border-border/90 bg-card",
                      "shadow-sm ring-1 ring-border/40",
                    )}
                  >
                    <div className="divide-y divide-border/70">
                      {row.getVisibleCells().map((cell) => {
                        const header = firstHeaderGroup?.headers.find(
                          (h) => h.column.id === cell.column.id,
                        );
                        if (!header || header.isPlaceholder) return null;
                        const isActions = cell.column.id === "actions";
                        return (
                          <div
                            key={cell.id}
                            className={cn(
                              "flex flex-col gap-1 px-4 py-3 sm:px-5",
                              isActions && "items-stretch",
                            )}
                          >
                            <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                            </span>
                            <div
                              className={cn(
                                "min-w-0 text-sm text-foreground",
                                isActions && "flex justify-end pt-1",
                              )}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-14 text-center text-sm text-muted-foreground">
              {data.length === 0
                ? "Sin datos"
                : "Sin coincidencias con la búsqueda."}
            </div>
          )}
        </div>
      </div>

      <nav
        className="border-t border-border/80 pt-4"
        aria-label="Paginación de la tabla"
      >
        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between xl:gap-6">
          <p
            role="status"
            className="min-w-0 text-sm leading-relaxed text-muted-foreground"
          >
            {isLoading ? (
              "Cargando datos…"
            ) : filteredCount === 0 ? (
              "Sin resultados."
            ) : (
              <>
                Mostrando{" "}
                <span className="tabular-nums font-medium text-foreground">
                  {startRow}–{endRow}
                </span>{" "}
                de{" "}
                <span className="tabular-nums font-medium text-foreground">
                  {filteredCount}
                </span>
                {filteredCount === 1 ? " resultado" : " resultados"}
                <span className="mx-1.5 text-muted-foreground/70">·</span>
                página{" "}
                <span className="tabular-nums font-medium text-foreground">
                  {pageIndex + 1}
                </span>{" "}
                de{" "}
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
                Filas por página
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
                onChange={(opt) => {
                  if (opt) table.setPageSize(opt.value);
                }}
                styles={pageSizeSelectStyles}
                className="min-w-[62px] shrink-0"
                classNames={{
                  control: () => "!min-h-7",
                }}
              />
            </div>

            <div
              className="flex items-center gap-1"
              role="group"
              aria-label="Ir a otra página de resultados"
            >
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="min-h-9 min-w-9 shrink-0"
                onClick={() => table.setPageIndex(0)}
                disabled={isLoading || !table.getCanPreviousPage()}
                aria-label="Ir a la primera página"
                title="Primera página"
              >
                <ChevronsLeft className="h-4 w-4" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="min-h-9 min-w-9 shrink-0"
                onClick={() => table.previousPage()}
                disabled={isLoading || !table.getCanPreviousPage()}
                aria-label="Página anterior"
                title="Anterior"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="min-h-9 min-w-9 shrink-0"
                onClick={() => table.nextPage()}
                disabled={isLoading || !table.getCanNextPage()}
                aria-label="Página siguiente"
                title="Siguiente"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="min-h-9 min-w-9 shrink-0"
                onClick={() => table.setPageIndex(Math.max(0, pageCount - 1))}
                disabled={isLoading || !table.getCanNextPage()}
                aria-label="Ir a la última página"
                title="Última página"
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
