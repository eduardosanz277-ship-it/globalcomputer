"use client";

import {
  useCallback,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import type { Brand } from "@/modules/admin/brands/brands.types";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { swalSaasConfirmAsync } from "@/utils/swal-saas";
import Select from "react-select";
import { appToolbarSelectStyles } from "@/components/ui/react-select-app-styles";
import { AdminEditDeleteRowMenu } from "@/components/admin/admin-edit-delete-row-menu";
import { SortableHeader } from "@/components/admin/admin-sortable-table-header";
import { FilterX, Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useServerAction } from "@/hooks/use-server-action";
import { deleteBrandAction } from "./actions";
import { BrandFormDialog } from "./BrandFormDialog";
import { BrandProfileCard } from "@/components/dashboard/brand-profile-card";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/utils/cn";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { formatRelativeLastAccess } from "@/utils/formatRelativeLastAccess";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const STATUS_FILTER_VALUES = ["all", "active", "inactive"] as const;

/** Ancho fijo ≥1440px: texto de la opción inicial + margen para padding e indicador (`ch`). */
const STATUS_FILTER_WIDE_CH =
  "Todos los estados".length + 7;
const NEW_BUTTON_MIN_W_CLASS = "min-w-[6.5rem]";

type StatusFilter = (typeof STATUS_FILTER_VALUES)[number];

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
  const { t, locale } = useI18n();
  const localizedBrandName =
    locale === "en" ? (brand.nameEn ?? brand.name) : brand.name;
  const { executeAsync, isPending } = useServerAction(deleteBrandAction, {
    successMessage: t("admin.brands.toast.archived"),
    errorMessage: t("admin.brands.toast.error"),
    onSuccess: () => {
      router.refresh();
    },
  });

  const handleDelete = async () => {
    await swalSaasConfirmAsync({
      title: t("admin.brands.confirm.archiveTitle"),
      html: t("admin.brands.confirm.archiveMessage").replace(
        "{name}",
        localizedBrandName,
      ),
      confirmButtonText: t("admin.brands.confirm.archiveConfirm"),
      cancelButtonText: t("admin.brands.form.cancel"),
      loadingConfirmText: t("admin.brands.confirm.archiveArchiving"),
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
      deleteLabel={t("admin.brands.confirm.archiveConfirm")}
      deletingLabel={t("admin.brands.confirm.archiveArchiving")}
    />
  );
}

export function AdminBrandsTable({ brands, isLoading = false }: Props) {
  const { t, locale } = useI18n();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);

  const statusFilterOptions = useMemo(
    () => [
      { value: "all" as const, label: t("admin.brands.filters.status.all") },
      {
        value: "active" as const,
        label: t("admin.brands.filters.status.active"),
      },
      {
        value: "inactive" as const,
        label: t("admin.brands.filters.status.inactive"),
      },
    ],
    [t],
  );

  const filtered = useMemo(() => {
    if (statusFilter === "all") return brands;
    if (statusFilter === "active") return brands.filter((b) => b.active);
    return brands.filter((b) => !b.active);
  }, [brands, statusFilter]);

  const filterValue =
    statusFilterOptions.find((o) => o.value === statusFilter) ??
    statusFilterOptions[0];

  const clearStatusFilter = useCallback(() => {
    setStatusFilter("all");
  }, []);

  const renderMobileRow = useCallback((row: Row<Brand>) => {
    const b = row.original;
    return (
      <li key={row.id}>
        <BrandProfileCard
          name={locale === "en" ? (b.nameEn ?? b.name) : b.name}
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
  }, [locale]);

  const columns = useMemo<ColumnDef<Brand>[]>(
    () => [
      {
        id: "brand",
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
          return a.localeCompare(b, locale, { sensitivity: "base" });
        },
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.brands.table.name")}
            ariaLabelIdle={t("admin.brands.table.nameSortIdle")}
            ariaLabelAsc={t("admin.brands.table.nameSortAsc")}
            ariaLabelDesc={t("admin.brands.table.nameSortDesc")}
          />
        ),
        meta: {
          cellClassName:
            "min-w-0 max-w-[min(28rem,50vw)] md:max-w-[min(22rem,40vw)]",
        },
        cell: ({ row }) => {
          const name = (
            locale === "en"
              ? (row.original.nameEn ?? row.original.name)
              : row.original.name
          ).trim();
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
            label={t("admin.brands.table.status")}
            ariaLabelIdle={t("admin.brands.table.statusSortIdle")}
            ariaLabelAsc={t("admin.brands.table.statusSortAsc")}
            ariaLabelDesc={t("admin.brands.table.statusSortDesc")}
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
              ? t("admin.brands.table.statusActive")
              : t("admin.brands.table.statusInactive")}
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
            label={t("admin.brands.table.updatedAt")}
            ariaLabelIdle={t("admin.brands.table.updatedAtSortIdle")}
            ariaLabelAsc={t("admin.brands.table.updatedAtSortAsc")}
            ariaLabelDesc={t("admin.brands.table.updatedAtSortDesc")}
          />
        ),
        cell: ({ row }) => {
          const raw = row.original.updatedAt;
          const relative = formatRelativeLastAccess(raw, locale);
          const absolute = formatDateDdMmYyyyHhMm(raw, locale);
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
                    {t("admin.brands.table.updatedTooltip")}
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
        header: () => <span className="sr-only">{t("admin.brands.table.actions")}</span>,
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
    [locale, t],
  );

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        enableSorting
        searchPlaceholder={t("admin.brands.filters.searchPlaceholder")}
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
                /* ≥1440px: ancho fijo según valor inicial; no encoge al elegir «Activas» / «Inactivas» */
                "min-[1440px]:box-border min-[1440px]:w-[var(--brands-status-filter-w)] min-[1440px]:min-w-[var(--brands-status-filter-w)] min-[1440px]:max-w-[var(--brands-status-filter-w)] min-[1440px]:flex-none min-[1440px]:shrink-0",
              )}
              style={
                {
                  ["--brands-status-filter-w" as string]: `${STATUS_FILTER_WIDE_CH}ch`,
                } as CSSProperties
              }
            >
              <Select<(typeof statusFilterOptions)[number], false>
                instanceId="brands-status-filter"
                inputId="brands-status-filter-input"
                aria-label={t("admin.brands.filters.statusAria")}
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
              title={t("admin.brands.filters.clear")}
              aria-label={t("admin.brands.filters.clear")}
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
            {t("admin.brands.buttonNew")}
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
