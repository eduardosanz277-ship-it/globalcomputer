"use client";

import type { AdminProductReview } from "@/modules/admin/product-reviews/product-reviews.types";
import { SlideOver } from "@/components/ui/slide-over";
import { AdminDetailPanelItem } from "@/components/admin/admin-detail-panel-item";
import { AdminMobileReviewRatingStars } from "@/components/admin/admin-mobile-review-rating-stars";
import { useI18n } from "@/components/i18n/I18nProvider";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { AdminTableEmptyEmDash } from "@/components/admin/admin-table-empty";
import { cn } from "@/utils/cn";
import {
  Clock3,
  Eye,
  MessageSquareQuote,
  Package,
  Star,
  User,
} from "lucide-react";

type Props = {
  review: AdminProductReview | null;
  open: boolean;
  onClose: () => void;
};

function productTitle(r: AdminProductReview, locale: string): string {
  if (locale === "en") return r.productNameEn?.trim() || r.productName;
  return r.productName;
}

export function ProductReviewDetailSlideOver({
  review,
  open,
  onClose,
}: Props) {
  const { t, locale } = useI18n();

  return (
    <SlideOver
      open={open && Boolean(review)}
      onClose={onClose}
      title={t("admin.reviews.products.detail.slideTitle")}
      description={t("admin.reviews.products.detail.slideDescription")}
      contentAriaLabel={t("admin.reviews.products.detail.contentAria")}
    >
      {review ? (
        <div className="space-y-4">
          <section className="space-y-3">
            <AdminDetailPanelItem
              label={t("admin.reviews.products.detail.product")}
              icon={<Package className="h-4 w-4" aria-hidden />}
              value={
                <p className="font-medium">{productTitle(review, locale)}</p>
              }
            />

            <AdminDetailPanelItem
              label={t("admin.reviews.products.table.reviewer")}
              icon={<User className="h-4 w-4" aria-hidden />}
              value={
                <>
                  <p className="font-medium">{review.reviewerName}</p>
                  <p className="text-muted-foreground">
                    {review.reviewerEmail?.trim() ? (
                      review.reviewerEmail
                    ) : (
                      <AdminTableEmptyEmDash />
                    )}
                  </p>
                </>
              }
            />

            <AdminDetailPanelItem
              label={t("admin.reviews.products.table.rating")}
              icon={<Star className="h-4 w-4" aria-hidden />}
              value={
                <AdminMobileReviewRatingStars rating={review.rating} />
              }
            />

            <AdminDetailPanelItem
              label={t("admin.reviews.products.detail.comment")}
              icon={<MessageSquareQuote className="h-4 w-4" aria-hidden />}
              value={
                review.comment?.trim() ? (
                  <p className="whitespace-pre-wrap break-words leading-relaxed">
                    {review.comment}
                  </p>
                ) : (
                  <span className="italic text-muted-foreground">
                    {t("admin.reviews.products.detail.commentEmpty")}
                  </span>
                )
              }
            />

            <AdminDetailPanelItem
              label={t("admin.reviews.products.detail.visible")}
              icon={<Eye className="h-4 w-4" aria-hidden />}
              value={
                <span
                  className={cn(
                    "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                    review.active
                      ? "border border-emerald-200/90 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
                      : "border border-border bg-muted/80 text-muted-foreground",
                  )}
                >
                  {review.active
                    ? t("admin.reviews.products.detail.visibleYes")
                    : t("admin.reviews.products.detail.visibleNo")}
                </span>
              }
            />

            <AdminDetailPanelItem
              label={t("admin.reviews.products.detail.createdAt")}
              labelClassName="inline-flex items-center gap-2 text-sm font-medium text-foreground"
              value={
                <p className="inline-flex items-center gap-2 text-muted-foreground">
                  <Clock3 className="h-4 w-4" aria-hidden />
                  {formatDateDdMmYyyyHhMm(review.createdAt, locale).replace(
                    ", ",
                    " ",
                  )}
                </p>
              }
            />
          </section>
        </div>
      ) : null}
    </SlideOver>
  );
}
