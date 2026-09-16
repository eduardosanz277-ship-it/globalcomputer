"use client";

import { useCallback, useMemo, useState, type CSSProperties } from "react";
import type { BrandType } from "@/modules/admin/brand-types/brand-types.types";
import type { Brand } from "@/modules/admin/brands/brands.types";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { swalSaasConfirmAsync } from "@/utils/swal-saas";
import Select from "react-select";
import { appToolbarSelectStyles } from "@/components/ui/react-select-app-styles";
import { AdminEditDeleteRowMenu } from "@/components/admin/admin-edit-delete-row-menu";
import { SortableHeader } from "@/components/admin/admin-sortable-table-header";
import { AdminTableEmptyEmDash } from "@/components/admin/admin-table-empty";
import { Filter, FilterX, Layers, Plus, Search } from "lucide-react";
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
import { bindAdminAction } from "@/lib/admin/bind-admin-action";
import { deleteBrandTypeAction } from "./actions";
import { BrandTypeFormDialog } from "./BrandTypeFormDialog";
import { cn } from "@/utils/cn";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { formatRelativeLastAccess } from "@/utils/formatRelativeLastAccess";
import { BrandTypeProfileCard } from "@/components/dashboard/brand-type-profile-card";
import { useI18n } from "@/components/i18n/I18nProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const STATUS_FILTER_VALUES = ["all", "active", "inactive"] as const;

type StatusFilter = (typeof STATUS_FILTER_VALUES)[number];

type FilterOption = { value: string; label: string };

/** Ancho del select «Todas las marcas» en barra escritorio (xl+): texto de referencia + margen (`ch`). */
const BRAND_FILTER_TOOLBAR_WIDE_CH = "Todas las marcas".length + 7;
const NEW_BUTTON_MIN_W_CLASS = "min-w-[6.5rem]";
const NAME_COLUMN_CLASS =
  "min-w-[18rem] max-w-[min(30rem,44vw)] md:max-w-[min(24rem,36vw)]";
const STATUS_COLUMN_CLASS = "w-[8.75rem] min-w-[8.75rem] max-w-[8.75rem]";
const UPDATED_AT_COLUMN_CLASS = "w-[12.75rem] min-w-[12.75rem] max-w-[12.75rem]";
const ACTIONS_COLUMN_CLASS = "w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem]";

interface Props {
  brands: Brand[];
  brandTypes: BrandType[];
  isLoading?: boolean;
}

function updatedAtSortMs(row: BrandType): number {
  const t = new Date(row.updatedAt).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function RowActions({ row, onEdit }: { row: BrandType; onEdit: () => void }) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const localizedRowName =
    locale === "en" ? (row.nameEn ?? row.name) : row.name;
  const localizedBrandName =
    locale === "en" ? (row.brandNameEn ?? row.brandName) : row.brandName;
  const { executeAsync, isPending } = useServerAction(
    bindAdminAction(deleteBrandTypeAction, locale),
    {
    successMessage: t("admin.brandTypes.toast.archived"),
    errorMessage: t("admin.brandTypes.toast.error"),
    onSuccess: () => {
      router.refresh();
    },
  });

  const handleDelete = async () => {
    await swalSaasConfirmAsync({
      title: t("admin.brandTypes.confirm.archiveTitle"),
      html: t("admin.brandTypes.confirm.archiveMessage")
        .replace("{name}", localizedRowName)
        .replace("{brand}", localizedBrandName),
      confirmButtonText: t("admin.brandTypes.confirm.archiveConfirm"),
      cancelButtonText: t("admin.brandTypes.form.cancel"),
      loadingConfirmText: t("admin.brandTypes.confirm.archiveArchiving"),
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
      deleteLabel={t("admin.brandTypes.confirm.archiveConfirm")}
      deletingLabel={t("admin.brandTypes.confirm.archiveArchiving")}
    />
  );
}

export function AdminBrandTypesTable({
  brands,
  brandTypes,
  isLoading = false,
}: Props) {
  const { t, locale } = useI18n();
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const [draftBrand, setDraftBrand] = useState<string>("all");
  const [draftStatus, setDraftStatus] = useState<StatusFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BrandType | null>(null);

  const statusFilterOptions = useMemo(
    () => [
      {
        value: "all" as const,
        label: t("admin.brandTypes.filters.status.all"),
      },
      {
        value: "active" as const,
        label: t("admin.brandTypes.filters.status.active"),
      },
      {
        value: "inactive" as const,
        label: t("admin.brandTypes.filters.status.inactive"),
      },
    ],
    [t],
  );

  const brandNameById = useMemo(() => {
    return new Map(
      brands.map((b) => [b.id, locale === "en" ? (b.nameEn ?? b.name) : b.name]),
    );
  }, [brands, locale]);

  const brandFilterOptions = useMemo<FilterOption[]>(
    () => [
      { value: "all", label: t("admin.brandTypes.filters.brandAll") },
      ...brands.map((b) => ({
        value: b.id,
        label: locale === "en" ? (b.nameEn ?? b.name) : b.name,
      })),
    ],
    [brands, locale, t],
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
    statusFilterOptions.find((o) => o.value === statusFilter) ??
    statusFilterOptions[0];

  const brandFilterValue =
    brandFilterOptions.find((o) => o.value === brandFilter) ??
    brandFilterOptions[0];

  const draftBrandFilterValue =
    brandFilterOptions.find((o) => o.value === draftBrand) ??
    brandFilterOptions[0];

  const draftStatusFilterValue =
    statusFilterOptions.find((o) => o.value === draftStatus) ??
    statusFilterOptions[0];

  const appliedFiltersCount = useMemo(() => {
    let n = 0;
    if (brandFilter !== "all") n += 1;
    if (statusFilter !== "all") n += 1;
    return n;
  }, [brandFilter, statusFilter]);

  const openFiltersModal = () => {
    setDraftBrand(brandFilter);
    setDraftStatus(statusFilter);
    setFiltersModalOpen(true);
  };

  const handleClearModalFilters = () => {
    setDraftBrand("all");
    setDraftStatus("all");
  };

  const handleApplyModalFilters = () => {
    setBrandFilter(draftBrand);
    setStatusFilter(draftStatus);
    setFiltersModalOpen(false);
  };

  const clearToolbarFilters = useCallback(() => {
    setBrandFilter("all");
    setStatusFilter("all");
  }, []);

  const columns = useMemo<ColumnDef<BrandType>[]>(
    () => [
      {
        id: "type",
        accessorFn: (row) =>
          `${brandNameById.get(row.brandId) ?? row.brandName} ${locale === "en" ? (row.nameEn ?? row.name) : row.name}`.trim(),
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const aBrand =
            brandNameById.get(rowA.original.brandId) ?? rowA.original.brandName;
          const bBrand =
            brandNameById.get(rowB.original.brandId) ?? rowB.original.brandName;
          const aName =
            locale === "en"
              ? (rowA.original.nameEn ?? rowA.original.name)
              : rowA.original.name;
          const bName =
            locale === "en"
              ? (rowB.original.nameEn ?? rowB.original.name)
              : rowB.original.name;
          return `${aBrand} ${aName}`.trim().localeCompare(
            `${bBrand} ${bName}`.trim(),
            locale,
            { sensitivity: "base" },
          );
        },
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.brandTypes.table.name")}
            ariaLabelIdle={t("admin.brandTypes.table.nameSortIdle")}
            ariaLabelAsc={t("admin.brandTypes.table.nameSortAsc")}
            ariaLabelDesc={t("admin.brandTypes.table.nameSortDesc")}
          />
        ),
        meta: {
          cellClassName: NAME_COLUMN_CLASS,
        },
        cell: ({ row }) => {
          const r = row.original;
          const title =
            (locale === "en" ? (r.nameEn ?? r.name) : r.name)?.trim() || "—";
          const secondary = (
            brandNameById.get(r.brandId) ??
            r.brandName
          )?.trim();
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
            label={t("admin.brandTypes.table.status")}
            ariaLabelIdle={t("admin.brandTypes.table.statusSortIdle")}
            ariaLabelAsc={t("admin.brandTypes.table.statusSortAsc")}
            ariaLabelDesc={t("admin.brandTypes.table.statusSortDesc")}
          />
        ),
        meta: {
          cellClassName: STATUS_COLUMN_CLASS,
        },
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
              ? t("admin.brandTypes.table.statusActive")
              : t("admin.brandTypes.table.statusInactive")}
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
            label={t("admin.brandTypes.table.updatedAt")}
            ariaLabelIdle={t("admin.brandTypes.table.updatedAtSortIdle")}
            ariaLabelAsc={t("admin.brandTypes.table.updatedAtSortAsc")}
            ariaLabelDesc={t("admin.brandTypes.table.updatedAtSortDesc")}
          />
        ),
        meta: {
          cellClassName: UPDATED_AT_COLUMN_CLASS,
        },
        cell: ({ row }) => {
          const raw = row.original.updatedAt;
          const relative = formatRelativeLastAccess(raw, locale);
          const absolute = formatDateDdMmYyyyHhMm(raw, locale);
          if (relative == null) {
            return (
              <span className="text-sm text-muted-foreground whitespace-nowrap tabular-nums">
                {absolute}
              </span>
            );
          }
          return (
            <TooltipProvider delayDuration={120}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help text-sm text-muted-foreground whitespace-nowrap tabular-nums">
                    {relative}
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="start"
                  className="rounded-xl border-border/60 bg-popover px-3 py-2 text-[11px] text-popover-foreground shadow-xl"
                >
                  <span className="block font-medium">
                    {t("admin.brandTypes.table.updatedTooltip")}
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
        header: () => <span className="sr-only">{t("admin.brandTypes.table.actions")}</span>,
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
    [brandNameById, locale, t],
  );

  const renderMobileRow = useCallback(
    (row: Row<BrandType>) => {
      const r = row.original;
      return (
        <li key={row.id}>
          <BrandTypeProfileCard
            name={locale === "en" ? (r.nameEn ?? r.name) : r.name}
            brandName={brandNameById.get(r.brandId) ?? r.brandName}
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
    [brandNameById, locale],
  );

  const noBrands = brands.length === 0;

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
            placeholder={t("admin.brandTypes.filters.searchMobilePlaceholder")}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            disabled={isLoading}
            className="h-9 w-full rounded-lg border-border/90 bg-background pl-9 pr-3 text-sm shadow-sm transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
            autoComplete="off"
            spellCheck={false}
            aria-label={t("admin.brandTypes.filters.searchAria")}
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
                ? t("admin.brandTypes.filters.openWithCount").replace(
                    "{count}",
                    String(appliedFiltersCount),
                  )
                : t("admin.brandTypes.filters.open")
            }
          >
            <Filter className="h-4 w-4 shrink-0" aria-hidden />
            {t("admin.brandTypes.filters.button")}
            {appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}
          </Button>
          <Button
            type="button"
            className={cn("h-9 min-w-0 flex-1", NEW_BUTTON_MIN_W_CLASS)}
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
            disabled={noBrands}
            title={
              noBrands
                ? t("admin.brandTypes.noBrandsTooltip")
                : undefined
            }
          >
            <Plus className="mr-2 h-4 w-4 shrink-0" aria-hidden />
            {t("admin.brandTypes.buttonNew")}
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
            placeholder={t("admin.brandTypes.filters.searchDesktopPlaceholder")}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            disabled={isLoading}
            className="h-9 w-full rounded-lg border-border/90 bg-background pl-9 pr-3 text-sm shadow-sm transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
            autoComplete="off"
            spellCheck={false}
            aria-label={t("admin.brandTypes.filters.searchAria")}
          />
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center xl:items-center xl:max-[1520px]:order-3 xl:max-[1520px]:basis-full min-[1521px]:flex-1 min-[1521px]:min-w-0">
          <div
            className="flex min-w-0 flex-1 items-center xl:box-border xl:w-[var(--toolbar-brand-filter-all-w)] xl:min-w-[var(--toolbar-brand-filter-all-w)] xl:max-w-[var(--toolbar-brand-filter-all-w)] xl:flex-none xl:shrink-0"
            style={
              {
                ["--toolbar-brand-filter-all-w" as string]: `${BRAND_FILTER_TOOLBAR_WIDE_CH}ch`,
              } as CSSProperties
            }
          >
            <Select<FilterOption, false>
              instanceId="brand-types-brand-filter"
              inputId="brand-types-brand-filter-input"
              aria-label={t("admin.brandTypes.filters.brandAria")}
              isSearchable={false}
              isClearable={false}
              options={brandFilterOptions}
              value={brandFilterValue}
              onChange={(opt) => {
                if (opt) setBrandFilter(opt.value);
              }}
              styles={appToolbarSelectStyles}
              className="w-full min-w-0"
            />
          </div>
          <div className="flex w-full min-w-0 flex-1 items-center min-[1440px]:max-w-[13rem]">
            <Select<(typeof statusFilterOptions)[number], false>
              instanceId="brand-types-status-filter"
              inputId="brand-types-status-filter-input"
              aria-label={t("admin.brandTypes.filters.statusAria")}
              isSearchable={false}
              isClearable={false}
              options={statusFilterOptions}
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
            title={t("admin.brandTypes.filters.clear")}
            aria-label={t("admin.brandTypes.filters.clear")}
          >
            <FilterX className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        <div className="flex w-full items-center xl:max-[1520px]:order-2 xl:max-[1520px]:w-auto xl:max-[1520px]:shrink-0 min-[1521px]:ml-auto min-[1521px]:w-auto min-[1521px]:shrink-0">
          <Button
            type="button"
            className={cn("h-9 w-full xl:w-auto", NEW_BUTTON_MIN_W_CLASS)}
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
            disabled={noBrands}
            title={
              noBrands
                ? t("admin.brandTypes.noBrandsTooltip")
                : undefined
            }
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            {t("admin.brandTypes.buttonNew")}
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
                  {t("admin.brandTypes.filters.modalTitle")}
                </DialogTitle>
                <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                  {t("admin.brandTypes.filters.modalDescription")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="max-h-[min(52vh,20rem)] overflow-y-auto px-6 py-5">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="brand-types-filter-modal-brand"
                  className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                >
                  {t("admin.brandTypes.filters.brandLabel")}
                </Label>
                <div className="flex w-full min-w-0 items-center">
                  <Select<FilterOption, false>
                    instanceId="brand-types-brand-filter-modal"
                    inputId="brand-types-filter-modal-brand"
                    aria-label={t("admin.brandTypes.filters.brandLabel")}
                    isSearchable={false}
                    isClearable={false}
                    options={brandFilterOptions}
                    value={draftBrandFilterValue}
                    onChange={(opt) => {
                      if (opt) setDraftBrand(opt.value);
                    }}
                    styles={appToolbarSelectStyles}
                    className="w-full"
                    menuPlacement="auto"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="brand-types-filter-modal-status"
                  className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                >
                  {t("admin.brandTypes.filters.statusLabel")}
                </Label>
                <div className="flex w-full min-w-0 items-center">
                  <Select<(typeof statusFilterOptions)[number], false>
                    instanceId="brand-types-status-filter-modal"
                    inputId="brand-types-filter-modal-status"
                    aria-label={t("admin.brandTypes.filters.statusLabel")}
                    isSearchable={false}
                    isClearable={false}
                    options={statusFilterOptions}
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
              {t("admin.brandTypes.filters.clear")}
            </Button>
            <Button
              type="button"
              className="min-w-[6.5rem] shadow-sm"
              onClick={handleApplyModalFilters}
            >
              {t("admin.brandTypes.filters.apply")}
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
        tableClassName="table-fixed"
        tableHeadCellClassName="!font-medium"
        tableBodyCellClassName="py-4"
        paginationButtonVariant="ghost"
        paginationClassName="border-border/50"
        getRowClassName={() =>
          "hover:bg-muted/50 transition-colors duration-150"
        }
        renderMobileRow={renderMobileRow}
      />

      {noBrands ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Layers className="h-4 w-4 shrink-0" aria-hidden />
          {t("admin.brandTypes.noBrandsHint")}
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
