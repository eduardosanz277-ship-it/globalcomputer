"use client";

import type { AdminSiteReview } from "@/modules/admin/site-reviews/site-reviews.types";
import { SlideOver } from "@/components/ui/slide-over";
import { AdminDetailPanelItem } from "@/components/admin/admin-detail-panel-item";
import { AdminMobileReviewRatingStars } from "@/components/admin/admin-mobile-review-rating-stars";
import { useI18n } from "@/components/i18n/I18nProvider";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { AdminTableEmptyEmDash } from "@/components/admin/admin-table-empty";
import { cn } from "@/utils/cn";
import { Clock3, Eye, MessageSquareQuote, Star, User } from "lucide-react";

type Props = {
  review: AdminSiteReview | null;
  open: boolean;
  onClose: () => void;
};

export function SiteReviewDetailSlideOver({
  review,
  open,
  onClose,
}: Props) {
  const { t, locale } = useI18n();

  return (
    <SlideOver
      open={open && Boolean(review)}
      onClose={onClose}
      title={t("admin.reviews.site.detail.slideTitle")}
      description={t("admin.reviews.site.detail.slideDescription")}
      contentAriaLabel={t("admin.reviews.site.detail.contentAria")}
    >
      {review ? (
        <div className="space-y-4">
          <section className="space-y-3">
            <AdminDetailPanelItem
              label={t("admin.reviews.site.detail.name")}
              icon={<User className="h-4 w-4" aria-hidden />}
              value={
                <>
                  <p className="font-medium">{review.name}</p>
                  <p className="text-muted-foreground">
                    {review.email?.trim() ? (
                      review.email
                    ) : (
                      <AdminTableEmptyEmDash />
                    )}
                  </p>
                </>
              }
            />

            <AdminDetailPanelItem
              label={t("admin.reviews.site.table.rating")}
              icon={<Star className="h-4 w-4" aria-hidden />}
              value={
                <AdminMobileReviewRatingStars rating={review.rating} />
              }
            />

            <AdminDetailPanelItem
              label={t("admin.reviews.site.detail.comment")}
              icon={<MessageSquareQuote className="h-4 w-4" aria-hidden />}
              value={
                review.comment?.trim() ? (
                  <p className="whitespace-pre-wrap break-words leading-relaxed">
                    {review.comment}
                  </p>
                ) : (
                  <span className="italic text-muted-foreground">
                    {t("admin.reviews.site.detail.commentEmpty")}
                  </span>
                )
              }
            />

            <AdminDetailPanelItem
              label={t("admin.reviews.site.detail.visible")}
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
                    ? t("admin.reviews.site.detail.visibleYes")
                    : t("admin.reviews.site.detail.visibleNo")}
                </span>
              }
            />

            <AdminDetailPanelItem
              label={t("admin.reviews.site.detail.createdAt")}
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
