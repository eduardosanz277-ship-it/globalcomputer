"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import type { ColumnDef, Row } from "@tanstack/react-table";
import type { AdminSiteReview } from "@/modules/admin/site-reviews/site-reviews.types";
import { AdminEditDeleteRowMenu } from "@/components/admin/admin-edit-delete-row-menu";
import { DataTable } from "@/components/ui/data-table";
import { SortableHeader } from "@/components/admin/admin-sortable-table-header";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { swalSaasConfirmAsync } from "@/utils/swal-saas";
import { useServerAction } from "@/hooks/use-server-action";
import { bindAdminAction } from "@/lib/admin/bind-admin-action";
import {
  deleteSiteReviewAdminAction,
  updateSiteReviewActiveAdminAction,
} from "@/modules/admin/site-reviews/actions";
import { SiteReviewDetailSlideOver } from "./SiteReviewDetailSlideOver";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { formatRelativeLastAccess } from "@/utils/formatRelativeLastAccess";
import { useI18n } from "@/components/i18n/I18nProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AdminMobileReviewRatingStars } from "@/components/admin/admin-mobile-review-rating-stars";
import { AdminTableEmptyEmDash } from "@/components/admin/admin-table-empty";

/** Tabla de sitio: reseñante flexible; valoración y fecha con anchos fijos. */
const COL_REVIEWER =
  "min-w-[14rem] w-[42%] max-w-[min(46rem,54vw)] text-left";
const COL_RATING =
  "w-[5.5rem] min-w-[5.5rem] max-w-[5.5rem] shrink-0 text-left pr-10";
/** Mismo patrón que fechas en marcas / tipos (`UPDATED_AT_COLUMN_CLASS`). */
const COL_DATE =
  "w-[12.75rem] min-w-[12.75rem] max-w-[12.75rem] shrink-0 text-left pl-10";
const COL_ACTIVE =
  "w-[8.5rem] min-w-[8.5rem] max-w-[9.5rem] shrink-0 text-left";
const COL_ACTIONS = "w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem] text-left";

type Props = {
  reviews: AdminSiteReview[];
  isLoading?: boolean;
};

function createdAtSortMs(row: AdminSiteReview): number {
  const t = new Date(row.createdAt).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function SiteReviewRowActions({
  review,
  onViewDetail,
  onDeleted,
}: {
  review: AdminSiteReview;
  onViewDetail: () => void;
  onDeleted: (id: string) => void;
}) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { executeAsync, isPending } = useServerAction(
    bindAdminAction(deleteSiteReviewAdminAction, locale),
    {
      successMessage: t("admin.reviews.site.toast.deleted"),
      errorMessage: t("admin.reviews.site.toast.deleteError"),
      onSuccess: () => {
        onDeleted(review.id);
        router.refresh();
      },
    },
  );

  const handleDelete = async () => {
    await swalSaasConfirmAsync({
      title: t("admin.reviews.site.confirm.deleteTitle"),
      html: `${t("admin.reviews.site.confirm.deleteMessagePrefix")} <strong>${review.name}</strong>.`,
      confirmButtonText: t("admin.reviews.site.confirm.deleteConfirm"),
      cancelButtonText: t("admin.faqs.form.cancel"),
      variant: "destructive",
      iconType: "warning",
      preConfirm: () => executeAsync(review.id),
    });
  };

  return (
    <AdminEditDeleteRowMenu
      onView={onViewDetail}
      onDelete={() => void handleDelete()}
      isDeleting={isPending}
      deleteLabel={t("admin.reviews.site.confirm.deleteConfirm")}
      deletingLabel={t("admin.reviews.site.menu.deleting")}
      openActionsLabel={t("admin.reviews.site.menu.openActions")}
      triggerAlign="start"
    />
  );
}

export function AdminSiteReviewsTable({
  reviews,
  isLoading = false,
}: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pendingVisibility, setPendingVisibility] = useState<{
    id: string;
    target: boolean;
  } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingVisibility) return;
    const row = reviews.find((r) => r.id === pendingVisibility.id);
    if (row && row.active === pendingVisibility.target) {
      setPendingVisibility(null);
    }
  }, [reviews, pendingVisibility]);

  const detailReview = useMemo(
    () => (detailId ? reviews.find((r) => r.id === detailId) ?? null : null),
    [reviews, detailId],
  );

  const { executeAsync: executeUpdateActive } = useServerAction(
    bindAdminAction(updateSiteReviewActiveAdminAction, locale),
    {
      errorMessage: t("admin.reviews.site.toast.updateError"),
    },
  );

  const handleActiveChange = useCallback(
    async (id: string, checked: boolean) => {
      setPendingVisibility({ id, target: checked });
      try {
        await executeUpdateActive(id, checked);
        startTransition(() => {
          router.refresh();
        });
      } catch {
        setPendingVisibility(null);
      }
    },
    [executeUpdateActive, router, startTransition],
  );

  const columns = useMemo<ColumnDef<AdminSiteReview>[]>(
    () => [
      {
        id: "reviewer",
        accessorFn: (row) =>
          `${row.name} ${row.email ?? ""}`.trim(),
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          rowA.original.name.localeCompare(rowB.original.name, locale, {
            sensitivity: "base",
          }),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.reviews.site.table.reviewer")}
            ariaLabelIdle={t("admin.reviews.site.table.reviewerSortIdle")}
            ariaLabelAsc={t("admin.reviews.site.table.reviewerSortAsc")}
            ariaLabelDesc={t("admin.reviews.site.table.reviewerSortDesc")}
          />
        ),
        meta: {
          cellClassName: COL_REVIEWER,
        },
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {row.original.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.email?.trim() ? (
                row.original.email
              ) : (
                <AdminTableEmptyEmDash />
              )}
            </p>
          </div>
        ),
      },
      {
        id: "rating",
        accessorKey: "rating",
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          rowA.original.rating - rowB.original.rating,
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.reviews.site.table.rating")}
            ariaLabelIdle={t("admin.reviews.site.table.ratingSortIdle")}
            ariaLabelAsc={t("admin.reviews.site.table.ratingSortAsc")}
            ariaLabelDesc={t("admin.reviews.site.table.ratingSortDesc")}
          />
        ),
        meta: {
          cellClassName: COL_RATING,
        },
        cell: ({ row }) => (
          <span className="tabular-nums text-sm font-semibold text-foreground">
            {row.original.rating}/5
          </span>
        ),
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          createdAtSortMs(rowA.original) - createdAtSortMs(rowB.original),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.reviews.site.table.date")}
            ariaLabelIdle={t("admin.reviews.site.table.dateSortIdle")}
            ariaLabelAsc={t("admin.reviews.site.table.dateSortAsc")}
            ariaLabelDesc={t("admin.reviews.site.table.dateSortDesc")}
          />
        ),
        meta: { cellClassName: COL_DATE },
        cell: ({ row }) => {
          const raw = row.original.createdAt;
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
                    {t("admin.reviews.site.table.dateTooltip")}
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
        id: "active",
        accessorKey: "active",
        enableSorting: false,
        header: t("admin.reviews.site.table.active"),
        meta: { cellClassName: COL_ACTIVE },
        cell: ({ row }) => {
          const id = row.original.id;
          const busy = pendingVisibility?.id === id;
          return (
            <div className="flex items-center justify-start gap-2">
              <Switch
                checked={row.original.active}
                disabled={busy}
                onCheckedChange={(next) => void handleActiveChange(id, next)}
                aria-label={t("admin.reviews.site.table.activeAria")}
              />
              {busy ? (
                <Loader2
                  className="h-4 w-4 shrink-0 animate-spin text-muted-foreground"
                  aria-hidden
                />
              ) : null}
            </div>
          );
        },
      },
      {
        id: "actions",
        meta: { cellClassName: COL_ACTIONS },
        header: () => (
          <span className="sr-only">
            {t("admin.reviews.site.table.actions")}
          </span>
        ),
        cell: ({ row }) => (
          <SiteReviewRowActions
            review={row.original}
            onViewDetail={() => setDetailId(row.original.id)}
            onDeleted={(id) =>
              setDetailId((current) => (current === id ? null : current))
            }
          />
        ),
      },
    ],
    [locale, t, pendingVisibility, handleActiveChange],
  );

  const renderMobileRow = useCallback(
    (row: Row<AdminSiteReview>) => {
      const r = row.original;
      const busy = pendingVisibility?.id === r.id;
      return (
        <li key={row.id}>
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <p className="truncate font-semibold text-foreground">
                  {r.name}
                </p>
                <p className="break-all text-xs text-muted-foreground">
                  {r.email?.trim() ? (
                    r.email
                  ) : (
                    <AdminTableEmptyEmDash />
                  )}
                </p>
                <AdminMobileReviewRatingStars rating={r.rating} />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {t("admin.reviews.site.table.active")}
                  </span>
                  <Switch
                    checked={r.active}
                    disabled={busy}
                    onCheckedChange={(next) =>
                      void handleActiveChange(r.id, next)
                    }
                  />
                  {busy ? (
                    <Loader2
                      className="h-4 w-4 shrink-0 animate-spin text-muted-foreground"
                      aria-hidden
                    />
                  ) : null}
                </div>
              </div>
              <SiteReviewRowActions
                review={r}
                onViewDetail={() => setDetailId(r.id)}
                onDeleted={(id) =>
                  setDetailId((current) => (current === id ? null : current))
                }
              />
            </div>
            <div className="mt-4 border-t border-border/60 pt-3">
              <span className="text-xs text-muted-foreground">
                {formatDateDdMmYyyyHhMm(r.createdAt, locale).replace(", ", " ")}
              </span>
            </div>
          </div>
        </li>
      );
    },
    [locale, t, pendingVisibility, handleActiveChange],
  );

  return (
    <>
    <DataTable
      columns={columns}
      data={reviews}
      isLoading={isLoading}
      enableSorting
      searchPlaceholder={t("admin.reviews.site.filters.searchPlaceholder")}
      tableClassName="table-fixed"
      tableHeadCellClassName="!font-medium !text-left"
      tableBodyCellClassName="py-4 !text-left"
      paginationButtonVariant="ghost"
      paginationClassName="border-border/50"
      renderMobileRow={renderMobileRow}
    />
    <SiteReviewDetailSlideOver
      review={detailReview}
      open={detailId != null}
      onClose={() => setDetailId(null)}
    />
    </>
  );
}
