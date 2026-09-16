"use client";

import {
  useCallback,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import type { GeneralCharacteristic } from "@/modules/admin/general-characteristics/general-characteristics.types";
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
import { bindAdminAction } from "@/lib/admin/bind-admin-action";
import { deleteGeneralCharacteristicAction } from "./actions";
import { GeneralCharacteristicFormDialog } from "./GeneralCharacteristicFormDialog";
import { useI18n } from "@/components/i18n/I18nProvider";
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

const STATUS_FILTER_VALUES = ["all", "active", "inactive"] as const;

/** Ancho fijo ≥1440px: texto de la opción inicial + margen para padding e indicador (`ch`). */
const STATUS_FILTER_WIDE_CH =
  "Todos los estados".length + 7;
const NEW_BUTTON_MIN_W_CLASS = "min-w-[6.5rem]";
const NAME_COLUMN_CLASS =
  "min-w-[18rem] max-w-[min(30rem,44vw)] md:max-w-[min(24rem,36vw)]";
const STATUS_COLUMN_CLASS = "w-[8.75rem] min-w-[8.75rem] max-w-[8.75rem]";
const UPDATED_AT_COLUMN_CLASS = "w-[12.75rem] min-w-[12.75rem] max-w-[12.75rem]";
const ACTIONS_COLUMN_CLASS = "w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem]";

type StatusFilter = (typeof STATUS_FILTER_VALUES)[number];

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
  const { t, locale } = useI18n();
  const localizedRowName =
    locale === "en" ? (row.nameEn ?? row.name) : row.name;
  const { executeAsync, isPending } = useServerAction(
    bindAdminAction(deleteGeneralCharacteristicAction, locale),
    {
      successMessage: t("admin.generalCharacteristics.toast.archived"),
      errorMessage: t("admin.generalCharacteristics.toast.error"),
      onSuccess: () => {
        router.refresh();
      },
    },
  );

  const handleDelete = async () => {
    await swalSaasConfirmAsync({
      title: t("admin.generalCharacteristics.confirm.archiveTitle"),
      html: t("admin.generalCharacteristics.confirm.archiveMessage").replace(
        "{name}",
        localizedRowName,
      ),
      confirmButtonText: t("admin.generalCharacteristics.confirm.archiveConfirm"),
      cancelButtonText: t("admin.generalCharacteristics.form.cancel"),
      loadingConfirmText: t(
        "admin.generalCharacteristics.confirm.archiveArchiving",
      ),
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
      deleteLabel={t("admin.generalCharacteristics.confirm.archiveConfirm")}
      deletingLabel={t("admin.generalCharacteristics.confirm.archiveArchiving")}
    />
  );
}

export function AdminGeneralCharacteristicsTable({
  characteristics,
  isLoading = false,
}: Props) {
  const { t, locale } = useI18n();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GeneralCharacteristic | null>(null);

  const statusFilterOptions = useMemo(
    () => [
      {
        value: "all" as const,
        label: t("admin.generalCharacteristics.filters.status.all"),
      },
      {
        value: "active" as const,
        label: t("admin.generalCharacteristics.filters.status.active"),
      },
      {
        value: "inactive" as const,
        label: t("admin.generalCharacteristics.filters.status.inactive"),
      },
    ],
    [t],
  );

  const filtered = useMemo(() => {
    if (statusFilter === "all") return characteristics;
    if (statusFilter === "active") {
      return characteristics.filter((c) => c.active);
    }
    return characteristics.filter((c) => !c.active);
  }, [characteristics, statusFilter]);

  const filterValue =
    statusFilterOptions.find((o) => o.value === statusFilter) ??
    statusFilterOptions[0];

  const clearStatusFilter = useCallback(() => {
    setStatusFilter("all");
  }, []);

  const columns = useMemo<ColumnDef<GeneralCharacteristic>[]>(
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
          return a.localeCompare(b, locale, { sensitivity: "base" });
        },
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.generalCharacteristics.table.name")}
            ariaLabelIdle={t("admin.generalCharacteristics.table.nameSortIdle")}
            ariaLabelAsc={t("admin.generalCharacteristics.table.nameSortAsc")}
            ariaLabelDesc={t("admin.generalCharacteristics.table.nameSortDesc")}
          />
        ),
        meta: {
          cellClassName: NAME_COLUMN_CLASS,
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
            label={t("admin.generalCharacteristics.table.status")}
            ariaLabelIdle={t("admin.generalCharacteristics.table.statusSortIdle")}
            ariaLabelAsc={t("admin.generalCharacteristics.table.statusSortAsc")}
            ariaLabelDesc={t("admin.generalCharacteristics.table.statusSortDesc")}
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
              ? t("admin.generalCharacteristics.table.statusActive")
              : t("admin.generalCharacteristics.table.statusInactive")}
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
            label={t("admin.generalCharacteristics.table.updatedAt")}
            ariaLabelIdle={t(
              "admin.generalCharacteristics.table.updatedAtSortIdle",
            )}
            ariaLabelAsc={t("admin.generalCharacteristics.table.updatedAtSortAsc")}
            ariaLabelDesc={t(
              "admin.generalCharacteristics.table.updatedAtSortDesc",
            )}
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
                    {t("admin.generalCharacteristics.table.updatedTooltip")}
                  </span>
                  <span className="mt-0.5 block text-muted-foreground">{absolute}</span>
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
          <span className="sr-only">
            {t("admin.generalCharacteristics.table.actions")}
          </span>
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
    (row: Row<GeneralCharacteristic>) => {
      const r = row.original;
      return (
        <li key={row.id}>
          <GeneralCharacteristicProfileCard
            name={locale === "en" ? (r.nameEn ?? r.name) : r.name}
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
        searchPlaceholder={t("admin.generalCharacteristics.filters.searchPlaceholder")}
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
                  ["--gc-status-filter-w" as string]: `${STATUS_FILTER_WIDE_CH}ch`,
                } as CSSProperties
              }
            >
              <Select<(typeof statusFilterOptions)[number], false>
                instanceId="general-characteristics-status-filter"
                inputId="general-characteristics-status-filter-input"
                aria-label={t("admin.generalCharacteristics.filters.statusAria")}
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
              title={t("admin.generalCharacteristics.filters.clear")}
              aria-label={t("admin.generalCharacteristics.filters.clear")}
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
            {t("admin.generalCharacteristics.buttonNew")}
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
