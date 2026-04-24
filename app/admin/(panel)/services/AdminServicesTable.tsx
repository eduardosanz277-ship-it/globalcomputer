"use client";

import { useCallback, useMemo, useState } from "react";
import type { Service } from "@/modules/admin/services/services.types";
import type { ColumnDef, Row } from "@tanstack/react-table";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { swalSaasConfirmAsync } from "@/utils/swal-saas";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useServerAction } from "@/hooks/use-server-action";
import { deleteServiceAction } from "./actions";
import { ServiceFormDialog } from "./ServiceFormDialog";
import { AdminTableEmptyEmDash } from "@/components/admin/admin-table-empty";
import { AdminEditDeleteRowMenu } from "@/components/admin/admin-edit-delete-row-menu";
import { SortableHeader } from "@/components/admin/admin-sortable-table-header";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { formatRelativeLastAccess } from "@/utils/formatRelativeLastAccess";
import { ServiceProfileCard } from "@/components/dashboard/service-profile-card";
import { useI18n } from "@/components/i18n/I18nProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  services: Service[];
  isLoading?: boolean;
}

const SERVICE_COLUMN_CLASS = "w-[43rem] min-w-[43rem] max-w-[43rem]";
const UPDATED_AT_COLUMN_CLASS = "w-[12rem] min-w-[12rem] max-w-[12rem]";
const ACTIONS_COLUMN_CLASS = "w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem]";

function serviceInitial(name: string): string {
  const t = name.trim();
  return t ? t.slice(0, 1).toUpperCase() : "?";
}

function serviceExcerpt(description: string | null): string | null {
  if (!description) return null;
  const plain = description
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > 0 ? plain : null;
}

function updatedAtSortMs(row: Service): number {
  const t = new Date(row.updatedAt).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function localizedServiceName(row: Service, locale: string): string {
  if (locale === "en") return row.nameEn?.trim() || row.name;
  return row.name;
}

function localizedServiceDescription(
  row: Service,
  locale: string,
): string | null {
  if (locale === "en") return row.descriptionEn ?? row.description;
  return row.description;
}

function RowActions({
  row,
  locale,
  onEdit,
  t,
}: {
  row: Service;
  locale: string;
  onEdit: () => void;
  t: (key: string) => string;
}) {
  const router = useRouter();
  const { executeAsync, isPending } = useServerAction(deleteServiceAction, {
    successMessage: t("admin.services.toast.deleted"),
    errorMessage: t("admin.services.toast.deleteError"),
    onSuccess: () => {
      router.refresh();
    },
  });

  const handleDelete = async () => {
    await swalSaasConfirmAsync({
      title: t("admin.services.confirm.deleteTitle"),
      html: `${t("admin.services.confirm.deleteMessagePrefix")} <strong>${localizedServiceName(row, locale)}</strong>.`,
      confirmButtonText: t("admin.services.confirm.deleteConfirm"),
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
      deletingLabel={t("admin.services.menu.deleting")}
      deleteLabel={t("admin.services.menu.delete")}
    />
  );
}

export function AdminServicesTable({ services, isLoading = false }: Props) {
  const { t, locale } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  const renderMobileRow = useCallback(
    (row: Row<Service>) => {
      const r = row.original;
      return (
        <li key={row.id}>
          <ServiceProfileCard
            name={localizedServiceName(r, locale)}
            imageUrl={r.imageUrl}
            description={localizedServiceDescription(r, locale)}
            updatedAt={r.updatedAt}
            className="hover:bg-muted/50 transition-colors duration-150"
            actions={
              <RowActions
                row={r}
                locale={locale}
                t={t}
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
    [locale, t],
  );

  const columns = useMemo<ColumnDef<Service>[]>(
    () => [
      {
        id: "service",
        accessorFn: (row) =>
          `${row.name} ${row.nameEn ?? ""} ${row.description ?? ""} ${row.descriptionEn ?? ""}`.trim(),
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          localizedServiceName(rowA.original, locale).localeCompare(
            localizedServiceName(rowB.original, locale),
            locale,
            {
              sensitivity: "base",
            },
          ),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.services.table.service")}
            ariaLabelIdle={t("admin.services.table.serviceSortIdle")}
            ariaLabelAsc={t("admin.services.table.sortAsc")}
            ariaLabelDesc={t("admin.services.table.sortDesc")}
          />
        ),
        meta: { cellClassName: SERVICE_COLUMN_CLASS },
        cell: ({ row }) => {
          const r = row.original;
          const imageUrl = r.imageUrl;
          const desc = serviceExcerpt(localizedServiceDescription(r, locale));
          const localizedName = localizedServiceName(r, locale);
          return (
            <div className="flex min-w-0 items-start gap-3">
              {imageUrl ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border/80 bg-muted">
                  <Image
                    src={imageUrl}
                    alt={localizedName}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-muted text-sm font-semibold text-muted-foreground"
                  aria-hidden
                >
                  {serviceInitial(localizedName)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-foreground">
                  {localizedName}
                </p>
                {desc ? (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {desc}
                  </p>
                ) : (
                  <AdminTableEmptyEmDash className="text-sm" />
                )}
              </div>
            </div>
          );
        },
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
            label={t("admin.services.table.updatedAt")}
            ariaLabelIdle={t("admin.services.table.updatedAtSortIdle")}
            ariaLabelAsc={t("admin.services.table.updatedAtSortAsc")}
            ariaLabelDesc={t("admin.services.table.updatedAtSortDesc")}
          />
        ),
        meta: { cellClassName: UPDATED_AT_COLUMN_CLASS },
        cell: ({ row }) => {
          const raw = row.original.updatedAt;
          const relative = formatRelativeLastAccess(raw, locale);
          const absolute = formatDateDdMmYyyyHhMm(raw, locale).replace(
            ", ",
            " ",
          );
          if (relative == null) {
            return (
              <span className="whitespace-nowrap tabular-nums text-sm text-muted-foreground">
                {absolute}
              </span>
            );
          }
          return (
            <TooltipProvider delayDuration={120}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help whitespace-nowrap tabular-nums text-sm text-muted-foreground">
                    {relative}
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="start"
                  className="rounded-xl border-border/60 bg-popover px-3 py-2 text-[11px] text-popover-foreground shadow-xl"
                >
                  <span className="block font-medium">
                    {t("admin.services.table.updatedTooltip")}
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
          <span className="sr-only">{t("admin.services.table.actions")}</span>
        ),
        cell: ({ row }) => (
          <RowActions
            row={row.original}
            locale={locale}
            t={t}
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
        data={services}
        isLoading={isLoading}
        enableSorting
        searchPlaceholder={t("admin.services.filters.searchPlaceholder")}
        tableClassName="table-fixed"
        tableHeadCellClassName="!font-medium"
        tableBodyCellClassName="py-4"
        paginationButtonVariant="ghost"
        paginationClassName="border-border/50"
        getRowClassName={() =>
          "hover:bg-muted/50 transition-colors duration-150"
        }
        renderMobileRow={renderMobileRow}
        toolbarActions={
          <Button
            type="button"
            className="h-9 w-full shrink-0 md:w-24"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            {t("admin.services.buttonNew")}
          </Button>
        }
      />

      <ServiceFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        service={editing}
      />
    </div>
  );
}
