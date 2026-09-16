"use client";

import { AdminEditDeleteRowMenu } from "@/components/admin/admin-edit-delete-row-menu";
import { SortableHeader } from "@/components/admin/admin-sortable-table-header";
import { CategoryProfileCard } from "@/components/dashboard/category-profile-card";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { appToolbarSelectStyles } from "@/components/ui/react-select-app-styles";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useServerAction } from "@/hooks/use-server-action";
import { bindAdminAction } from "@/lib/admin/bind-admin-action";
import type { CategoryAdmin } from "@/modules/admin/categories/categories.types";
import { cn } from "@/utils/cn";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { formatRelativeLastAccess } from "@/utils/formatRelativeLastAccess";
import { swalSaasConfirmAsync } from "@/utils/swal-saas";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { FilterX, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, type CSSProperties } from "react";
import Select from "react-select";
import { softDeleteCategoryAdminAction } from "./actions";
import { CategoryFormDialog } from "./CategoryFormDialog";

type StatusFilter = "all" | "active" | "inactive";

/**
 * Ancho del select de estados (en `ch`) fijado con el texto en español
 * ("Todos los estados" + margen) para que no varíe al cambiar de idioma.
 */
const STATUS_FILTER_WIDTH_CH = "Todos los estados".length + 7;

/**
 * `min-width` del botón «Nueva» (en `rem`) calibrado con el copy en español
 * e icono, para que el ancho no dependa de "New" frente a "Nueva".
 */
const NEW_BUTTON_MIN_W_CLASS = "min-w-[6.5rem]";

/**
 * Anchos fijos de columnas para evitar saltos al cambiar idioma.
 * - Fecha considera el caso más largo: fecha absoluta (`MM/DD/YYYY, h:mm AM/PM`).
 */
const NAME_COLUMN_CLASS =
  "min-w-[18rem] max-w-[min(42rem,58vw)] md:max-w-[min(36rem,50vw)]";
const STATUS_COLUMN_CLASS = "w-[8.5rem] min-w-[8.5rem] max-w-[8.5rem]";
const UPDATED_AT_COLUMN_CLASS = "w-[13rem] min-w-[13rem] max-w-[13rem]";
const ACTIONS_COLUMN_CLASS = "w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem]";

interface Props {
  categories: CategoryAdmin[];
  isLoading?: boolean;
}

function updatedAtSortMs(row: CategoryAdmin): number {
  const t = new Date(row.updatedAt).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function RowActions({
  row,
  onEdit,
}: {
  row: CategoryAdmin;
  onEdit: () => void;
}) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const localizedRowName =
    locale === "en" ? (row.nameEn ?? row.name) : row.name;
  const { executeAsync, isPending } = useServerAction(
    bindAdminAction(softDeleteCategoryAdminAction, locale),
    {
      successMessage: t("admin.categories.toast.archived"),
      errorMessage: t("admin.categories.toast.error"),
      onSuccess: () => {
        router.refresh();
      },
    },
  );

  const handleDelete = async () => {
    await swalSaasConfirmAsync({
      title: t("admin.categories.confirm.archiveTitle"),
      html: t("admin.categories.confirm.archiveMessage").replace(
        "{name}",
        localizedRowName,
      ),
      confirmButtonText: t("admin.categories.confirm.archiveConfirm"),
      cancelButtonText: t("admin.categories.form.cancel"),
      loadingConfirmText: t("admin.categories.confirm.archiveArchiving"),
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
      deleteLabel={t("admin.categories.confirm.archiveConfirm")}
      deletingLabel={t("admin.categories.confirm.archiveArchiving")}
      showDelete={row.active}
    />
  );
}

export function AdminCategoriesTable({ categories, isLoading = false }: Props) {
  const { t, locale } = useI18n();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryAdmin | null>(null);

  const statusFilterOptions = useMemo(
    () => [
      {
        value: "all" as const,
        label: t("admin.categories.filters.status.all"),
      },
      {
        value: "active" as const,
        label: t("admin.categories.filters.status.active"),
      },
      {
        value: "inactive" as const,
        label: t("admin.categories.filters.status.inactive"),
      },
    ],
    [t],
  );

  const filtered = useMemo(() => {
    if (statusFilter === "all") return categories;
    if (statusFilter === "active") {
      return categories.filter((c) => c.active);
    }
    return categories.filter((c) => !c.active);
  }, [categories, statusFilter]);

  const filterValue =
    statusFilterOptions.find((o) => o.value === statusFilter) ??
    statusFilterOptions[0];

  const clearStatusFilter = useCallback(() => {
    setStatusFilter("all");
  }, []);

  const columns = useMemo<ColumnDef<CategoryAdmin>[]>(
    () => [
      {
        id: "name",
        accessorFn: (row) =>
          locale === "en" ? (row.nameEn ?? row.name) : row.name,
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const a =
            locale === "en"
              ? (rowA.original.nameEn ?? rowA.original.name)
              : rowA.original.name;
          const b =
            locale === "en"
              ? (rowB.original.nameEn ?? rowB.original.name)
              : rowB.original.name;
          return a.localeCompare(b, locale === "en" ? "en" : "es", {
            sensitivity: "base",
          });
        },
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.categories.table.name")}
            ariaLabelIdle={`Ordenar por ${t("admin.categories.table.name").toLowerCase()}`}
            ariaLabelAsc={`Ordenado de la A a la Z. Clic para invertir`}
            ariaLabelDesc={`Ordenado de la Z a la A. Clic para quitar orden`}
          />
        ),
        meta: {
          cellClassName: NAME_COLUMN_CLASS,
        },
        cell: ({ row }) => {
          const name =
            locale === "en"
              ? (row.original.nameEn ?? row.original.name)
              : row.original.name;
          const trimmed = name.trim();
          return (
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-foreground">
                {trimmed || "—"}
              </p>
            </div>
          );
        },
      },
      {
        id: "active",
        accessorKey: "active",
        meta: { cellClassName: STATUS_COLUMN_CLASS },
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          Number(rowB.original.active) - Number(rowA.original.active),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.categories.table.status")}
            ariaLabelIdle={`Ordenar por ${t("admin.categories.table.status").toLowerCase()}`}
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
            {row.original.active
              ? t("admin.categories.table.statusActive")
              : t("admin.categories.table.statusInactive")}
          </span>
        ),
      },
      {
        id: "updatedAt",
        accessorKey: "updatedAt",
        meta: { cellClassName: UPDATED_AT_COLUMN_CLASS },
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          updatedAtSortMs(rowA.original) - updatedAtSortMs(rowB.original),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.categories.table.updatedAt")}
            ariaLabelIdle={t("admin.categories.table.updatedAtSortIdle")}
            ariaLabelAsc={t("admin.categories.table.updatedAtSortAsc")}
            ariaLabelDesc={t("admin.categories.table.updatedAtSortDesc")}
          />
        ),
        cell: ({ row }) => {
          const raw = row.original.updatedAt;
          const relative = formatRelativeLastAccess(raw, locale);
          const absolute = formatDateDdMmYyyyHhMm(raw, locale);
          if (relative == null) {
            return (
              <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
                {absolute}
              </span>
            );
          }
          return (
            <TooltipProvider delayDuration={120}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help whitespace-nowrap text-sm tabular-nums text-muted-foreground">
                    {relative}
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="start"
                  className="rounded-xl border-border/60 bg-popover px-3 py-2 text-[11px] text-popover-foreground shadow-xl"
                >
                  <span className="block font-medium">
                    {t("admin.categories.table.updatedTooltip")}
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
        meta: { align: "right", cellClassName: ACTIONS_COLUMN_CLASS },
        header: () => (
          <span className="sr-only">{t("admin.categories.table.actions")}</span>
        ),
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
    [locale, t],
  );

  const renderMobileRow = useCallback(
    (row: Row<CategoryAdmin>) => {
      const r = row.original;
      const localizedName = locale === "en" ? (r.nameEn ?? r.name) : r.name;
      return (
        <li key={row.id}>
          <CategoryProfileCard
            name={localizedName}
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
    [locale],
  );

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        enableSorting
        searchPlaceholder={t("admin.categories.filters.searchPlaceholder")}
        tableClassName="table-fixed"
        tableHeadCellClassName="!font-medium"
        tableBodyCellClassName="py-4"
        paginationButtonVariant="ghost"
        paginationClassName="border-border/50"
        getRowClassName={() =>
          "hover:bg-muted/50 transition-colors duration-150"
        }
        renderMobileRow={renderMobileRow}
        toolbarFilters={
          <div className="flex w-full min-w-0 items-center gap-2">
            <div
              className={cn(
                "min-w-0 flex-1",
                "min-[1440px]:box-border min-[1440px]:w-[var(--gc-status-filter-w)] min-[1440px]:min-w-[var(--gc-status-filter-w)] min-[1440px]:max-w-[var(--gc-status-filter-w)] min-[1440px]:flex-none min-[1440px]:shrink-0",
              )}
              style={
                {
                  ["--gc-status-filter-w" as string]: `${STATUS_FILTER_WIDTH_CH}ch`,
                } as CSSProperties
              }
            >
              <Select<(typeof statusFilterOptions)[number], false>
                instanceId="admin-categories-status-filter"
                inputId="admin-categories-status-filter-input"
                aria-label={t("admin.categories.filters.status.all")}
                isSearchable={false}
                isClearable={false}
                options={statusFilterOptions}
                value={filterValue}
                onChange={(opt) => {
                  if (opt) setStatusFilter(opt.value);
                }}
                styles={appToolbarSelectStyles}
                className="w-full min-w-0"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 border-border/80 text-muted-foreground hover:text-foreground"
              disabled={isLoading || statusFilter === "all"}
              onClick={clearStatusFilter}
              title={t("admin.categories.filters.clear")}
              aria-label={t("admin.categories.filters.clear")}
            >
              <FilterX className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        }
        toolbarActions={
          <Button
            type="button"
            className={cn(
              "h-9 w-full shrink-0 md:w-auto",
              NEW_BUTTON_MIN_W_CLASS,
            )}
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            {t("admin.categories.buttonNew")}
          </Button>
        }
      />

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        category={editing}
      />
    </div>
  );
}
