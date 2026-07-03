"use client";

import { useMemo, useState } from "react";
import { LocalizedText } from "@/components/i18n/LocalizedText";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { LeaveReviewSiteFormSlideOver } from "@/components/site/LeaveReviewSiteFormSlideOver";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/utils/cn";
import type {
  ProductReviewListItem,
  SiteReviewListItem,
} from "@/modules/site/leave-review-data.service";
import { CheckCircle2, MessageCircle, Star, UserRound } from "lucide-react";
import Link from "next/link";

const reviewStoryCardClassName =
  "flex h-full flex-col rounded-3xl border border-border/50 bg-card p-5 shadow-soft sm:p-6";

function topReviewsByRating<T extends { rating: number; createdAt: string }>(
  rows: T[],
  limit: number,
): T[] {
  return [...rows]
    .sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return (
        (Number.isNaN(dateB) ? 0 : dateB) - (Number.isNaN(dateA) ? 0 : dateA)
      );
    })
    .slice(0, limit);
}

type Props = {
  productReviews: ProductReviewListItem[];
  siteReviews: SiteReviewListItem[];
  sectionClassName?: string;
};

export function HomeReviewsSection({
  productReviews,
  siteReviews,
  sectionClassName,
}: Props) {
  const [panelOpen, setPanelOpen] = useState(false);

  const topProductReviews = useMemo(
    () => topReviewsByRating(productReviews, 3),
    [productReviews],
  );
  const topSiteReviews = useMemo(
    () => topReviewsByRating(siteReviews, 3),
    [siteReviews],
  );

  const displayMode =
    topProductReviews.length > 0
      ? "product"
      : topSiteReviews.length > 0
        ? "site"
        : "empty";

  return (
    <>
      <section className={sectionClassName}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <HomeSectionHeading
            title={<LocalizedText es="Historias reales" en="Real stories" />}
            description={
              <LocalizedText
                es="Personas como tú que ya confiaron en nosotros."
                en="People like you who already trusted us."
              />
            }
            titleClassName="text-3xl sm:text-4xl"
          />

          {displayMode === "empty" ? (
            <div
              className="relative mt-6 overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-card via-card to-muted/35 p-8 shadow-soft sm:mt-8 sm:p-10"
              role="status"
            >
              <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:gap-8 sm:text-left">
                <div
                  className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/[0.06] text-primary shadow-sm ring-1 ring-primary/5"
                  aria-hidden
                >
                  <MessageCircle className="h-8 w-8" strokeWidth={1.35} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="max-w-lg text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                    <LocalizedText
                      es="Aún no hay reseñas publicadas. Sé la primera persona en contar tu experiencia con nosotros."
                      en="There are no reviews published yet. Be the first to share your experience with us."
                    />
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPanelOpen(true)}
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "shrink-0 rounded-full px-6 shadow-md shadow-primary/20",
                  )}
                >
                  <LocalizedText es="Escribir una reseña" en="Write a review" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-5 sm:mt-8 sm:grid-cols-2 lg:grid-cols-3">
                {displayMode === "product"
                  ? topProductReviews.map((review) => (
                      <figure
                        key={review.id}
                        className={reviewStoryCardClassName}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div
                            className="flex items-center gap-0.5 text-amber-500"
                            aria-hidden
                          >
                            {Array.from({ length: review.rating }).map(
                              (_, i) => (
                                <Star
                                  key={i}
                                  className="h-4 w-4 fill-current"
                                />
                              ),
                            )}
                          </div>
                          <CheckCircle2
                            className="h-5 w-5 shrink-0 text-primary"
                            aria-hidden
                          />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-foreground">
                          {review.productName}
                        </p>
                        <blockquote className="mt-4 flex-1 border-l-2 border-primary/40 pl-4 text-sm italic leading-relaxed text-muted-foreground">
                          {review.comment ?? (
                            <LocalizedText
                              es="Sin comentario escrito."
                              en="No written comment."
                            />
                          )}
                        </blockquote>
                        <figcaption className="mt-5 text-sm font-bold text-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <UserRound
                              className="h-4 w-4 text-primary/85"
                              aria-hidden
                            />
                            {review.reviewerLabel}
                          </span>
                        </figcaption>
                      </figure>
                    ))
                  : topSiteReviews.map((review) => (
                      <figure
                        key={review.id}
                        className={reviewStoryCardClassName}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div
                            className="flex items-center gap-0.5 text-amber-500"
                            aria-hidden
                          >
                            {Array.from({ length: review.rating }).map(
                              (_, i) => (
                                <Star
                                  key={i}
                                  className="h-4 w-4 fill-current"
                                />
                              ),
                            )}
                          </div>
                          <CheckCircle2
                            className="h-5 w-5 shrink-0 text-primary"
                            aria-hidden
                          />
                        </div>
                        <blockquote className="mt-4 flex-1 border-l-2 border-primary/40 pl-4 text-sm italic leading-relaxed text-muted-foreground">
                          {review.comment}
                        </blockquote>
                        <figcaption className="mt-5 text-sm font-bold text-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <UserRound
                              className="h-4 w-4 text-primary/85"
                              aria-hidden
                            />
                            {review.name}
                          </span>
                        </figcaption>
                      </figure>
                    ))}
              </div>
              <div className="mt-8 flex justify-center">
                <Link
                  href="/leave-review"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "rounded-full border-primary/30 bg-card px-6 font-semibold hover:bg-primary/5",
                  )}
                >
                  <LocalizedText
                    es="Ver todas las reseñas"
                    en="See all reviews"
                  />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <LeaveReviewSiteFormSlideOver
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
      />
    </>
  );
}
