"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import type { ColumnDef, Row } from "@tanstack/react-table";
import type { AdminProductReview } from "@/modules/admin/product-reviews/product-reviews.types";
import { AdminEditDeleteRowMenu } from "@/components/admin/admin-edit-delete-row-menu";
import { DataTable } from "@/components/ui/data-table";
import { SortableHeader } from "@/components/admin/admin-sortable-table-header";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { swalSaasConfirmAsync } from "@/utils/swal-saas";
import { useServerAction } from "@/hooks/use-server-action";
import {
  deleteProductReviewAdminAction,
  updateProductReviewActiveAdminAction,
} from "@/modules/admin/product-reviews/actions";
import { ProductReviewDetailSlideOver } from "./ProductReviewDetailSlideOver";
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

/** Anchos para `table-fixed`: fecha y valoración con anchos fijos para no solaparse. */
const COL_PRODUCT = "min-w-[13rem] w-[34%] max-w-[min(40rem,50vw)] text-left";
const COL_REVIEWER = "min-w-[11rem] w-[31%] max-w-[min(34rem,42vw)] text-left";
const COL_RATING =
  "w-[6.5rem] min-w-[6.5rem] max-w-[6.5rem] shrink-0 text-left pr-10";
const COL_DATE =
  "w-[14rem] min-w-[14rem] max-w-[15rem] shrink-0 text-left pl-10";
const COL_ACTIVE =
  "w-[8.5rem] min-w-[8.5rem] max-w-[9.5rem] shrink-0 text-left";
const COL_ACTIONS = "w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem] text-left";

type Props = {
  reviews: AdminProductReview[];
  isLoading?: boolean;
};

function localizedProductName(row: AdminProductReview, locale: string): string {
  if (locale === "en") return row.productNameEn?.trim() || row.productName;
  return row.productName;
}

function createdAtSortMs(row: AdminProductReview): number {
  const t = new Date(row.createdAt).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function ProductReviewRowActions({
  review,
  onViewDetail,
  onDeleted,
}: {
  review: AdminProductReview;
  onViewDetail: () => void;
  onDeleted: (id: string) => void;
}) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const productLabel = localizedProductName(review, locale);
  const { executeAsync, isPending } = useServerAction(
    deleteProductReviewAdminAction,
    {
      successMessage: t("admin.reviews.products.toast.deleted"),
      errorMessage: t("admin.reviews.products.toast.deleteError"),
      onSuccess: () => {
        onDeleted(review.id);
        router.refresh();
      },
    },
  );

  const handleDelete = async () => {
    await swalSaasConfirmAsync({
      title: t("admin.reviews.products.confirm.deleteTitle"),
      html: `${t("admin.reviews.products.confirm.deleteMessagePrefix")} <strong>${productLabel}</strong>.`,
      confirmButtonText: t("admin.reviews.products.confirm.deleteConfirm"),
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
      deleteLabel={t("admin.reviews.products.confirm.deleteConfirm")}
      deletingLabel={t("admin.reviews.products.menu.deleting")}
      openActionsLabel={t("admin.reviews.products.menu.openActions")}
      triggerAlign="start"
    />
  );
}

export function AdminProductReviewsTable({
  reviews,
  isLoading = false,
}: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [, startTransition] = useTransition();
  /** Mientras haya petición + refresh: el Switch no cambia hasta que `reviews` tenga el valor guardado. */
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
    () => (detailId ? (reviews.find((r) => r.id === detailId) ?? null) : null),
    [reviews, detailId],
  );

  const { executeAsync: executeUpdateActive } = useServerAction(
    updateProductReviewActiveAdminAction,
    {
      errorMessage: t("admin.reviews.products.toast.updateError"),
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

  const columns = useMemo<ColumnDef<AdminProductReview>[]>(
    () => [
      {
        id: "product",
        accessorFn: (row) =>
          `${localizedProductName(row, locale)} ${row.productId}`.trim(),
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          localizedProductName(rowA.original, locale).localeCompare(
            localizedProductName(rowB.original, locale),
            locale,
            { sensitivity: "base" },
          ),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.reviews.products.table.product")}
            ariaLabelIdle={t("admin.reviews.products.table.productSortIdle")}
            ariaLabelAsc={t("admin.reviews.products.table.productSortAsc")}
            ariaLabelDesc={t("admin.reviews.products.table.productSortDesc")}
          />
        ),
        meta: {
          cellClassName: COL_PRODUCT,
        },
        cell: ({ row }) => (
          <span className="block truncate text-sm font-medium text-foreground">
            {localizedProductName(row.original, locale)}
          </span>
        ),
      },
      {
        id: "reviewer",
        accessorFn: (row) =>
          `${row.reviewerName} ${row.reviewerEmail ?? ""}`.trim(),
        header: t("admin.reviews.products.table.reviewer"),
        meta: {
          cellClassName: COL_REVIEWER,
        },
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {row.original.reviewerName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.reviewerEmail?.trim() ? (
                row.original.reviewerEmail
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
        sortingFn: (rowA, rowB) => rowA.original.rating - rowB.original.rating,
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.reviews.products.table.rating")}
            ariaLabelIdle={t("admin.reviews.products.table.ratingSortIdle")}
            ariaLabelAsc={t("admin.reviews.products.table.ratingSortAsc")}
            ariaLabelDesc={t("admin.reviews.products.table.ratingSortDesc")}
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
            label={t("admin.reviews.products.table.date")}
            ariaLabelIdle={t("admin.reviews.products.table.dateSortIdle")}
            ariaLabelAsc={t("admin.reviews.products.table.dateSortAsc")}
            ariaLabelDesc={t("admin.reviews.products.table.dateSortDesc")}
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
                    {t("admin.reviews.products.table.dateTooltip")}
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
        enableSorting: true,
        sortingFn: (rowA, rowB) =>
          Number(rowB.original.active) - Number(rowA.original.active),
        header: ({ column }) => (
          <SortableHeader
            column={column}
            label={t("admin.reviews.products.table.active")}
            ariaLabelIdle={t("admin.reviews.products.table.activeSortIdle")}
            ariaLabelAsc={t("admin.reviews.products.table.activeSortAsc")}
            ariaLabelDesc={t("admin.reviews.products.table.activeSortDesc")}
          />
        ),
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
                aria-label={t("admin.reviews.products.table.activeAria")}
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
            {t("admin.reviews.products.table.actions")}
          </span>
        ),
        cell: ({ row }) => (
          <ProductReviewRowActions
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
    (row: Row<AdminProductReview>) => {
      const r = row.original;
      const busy = pendingVisibility?.id === r.id;
      return (
        <li key={row.id}>
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <p className="truncate font-semibold text-foreground">
                  {localizedProductName(r, locale)}
                </p>
                <p className="truncate text-sm font-medium text-foreground">
                  {r.reviewerName}
                </p>
                <p className="break-all text-xs text-muted-foreground">
                  {r.reviewerEmail?.trim() ? (
                    r.reviewerEmail
                  ) : (
                    <AdminTableEmptyEmDash />
                  )}
                </p>
                <AdminMobileReviewRatingStars rating={r.rating} />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {t("admin.reviews.products.table.active")}
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
              <ProductReviewRowActions
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
        searchPlaceholder={t(
          "admin.reviews.products.filters.searchPlaceholder",
        )}
        tableClassName="table-fixed min-w-[720px]"
        tableHeadCellClassName="!font-medium !text-left"
        tableBodyCellClassName="py-4 !text-left"
        paginationButtonVariant="ghost"
        paginationClassName="border-border/50"
        renderMobileRow={renderMobileRow}
      />
      <ProductReviewDetailSlideOver
        review={detailReview}
        open={detailId != null}
        onClose={() => setDetailId(null)}
      />
    </>
  );
}
