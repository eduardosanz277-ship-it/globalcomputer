"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  FilterX,
  ImageOff,
  Minus,
  Plus,
  Star,
  Info,
  UserRound,
  ZoomIn,
} from "lucide-react";
import Select from "react-select";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { ButtonPending } from "@/components/ui/button-pending";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { appSelectStyles } from "@/components/ui/react-select-app-styles";
import { SlideOver, SlideOverFooter } from "@/components/ui/slide-over";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StoreQuantityStepper } from "@/components/store/StoreQuantityStepper";
import {
  PRODUCT_REVIEW_FORM_ID,
  ProductReviewForm,
} from "@/components/site/ProductReviewForm";
import { gcCartAddProduct } from "@/lib/store-cart";
import {
  activeDiscountPercent,
  resolveStorefrontBasePrice,
  resolveStorefrontUnitPrice,
  type StorefrontPriceTier,
} from "@/lib/storefront-pricing";
import {
  hasPublishedRichHtml,
  resolveLocalizedRichHtml,
} from "@/lib/plainTextFromHtml";
import { stockBadgeClass } from "@/lib/storefront-stock";
import { useI18n } from "@/components/i18n/I18nProvider";
import {
  isNewFromCreatedAt,
  storefrontLocalizedText,
  storefrontProductDisplayName,
} from "@/modules/catalog/storefront-product.shared";
import { SimilarProducts } from "@/components/SimilarProducts";
import type { StorefrontProductDetail } from "@/modules/catalog/storefront-product-detail.service";
import type { StorefrontProduct } from "@/modules/catalog/storefront-product.shared";
import type { ProductReviewDetailListItem } from "@/modules/site/leave-review-data.service";
import { cn } from "@/utils/cn";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { formatRelativeLastAccess } from "@/utils/formatRelativeLastAccess";
import { ProductDescriptionViewer } from "@/components/ProductDescriptionViewer";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

function formatUsd(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

type Props = {
  product: StorefrontProductDetail;
  priceTier: StorefrontPriceTier;
  initialProductReviews: ProductReviewDetailListItem[];
  similarProducts: StorefrontProduct[];
  accessoryProducts: StorefrontProduct[];
};

type ProductDescriptionCollapsibleProps = {
  description: string;
  /** Encabezado del acordeón (p. ej. Descripción o Especificaciones). */
  title?: string;
};
type ProductInfoTabId = "technical_specs" | "downloads";

const PRODUCT_REVIEWS_PAGE_SIZE_DESKTOP = 12;
const PRODUCT_REVIEWS_PAGE_SIZE_MOBILE_TABLET = 6;
const PRODUCT_REVIEWS_SELECT_WIDTH_CH = 28;

type ReviewDateSort = "newest" | "oldest" | "best_rating" | "worst_rating";
type ReviewRatingFilter = "all" | "5" | "4" | "3" | "2" | "1";
type ReviewDateSortOption = { value: ReviewDateSort; label: string };
type ReviewRatingOption = { value: ReviewRatingFilter; label: string };

const TABLE_LIKE_TOOLTIP_CLASS =
  "rounded-xl border border-border/60 bg-popover px-3 py-2 text-[11px] text-popover-foreground shadow-xl";

function formatSortSelectedLabel(
  prefix: string,
  option: ReviewDateSortOption,
): string {
  return `${prefix} ${option.label}`;
}

function formatRatingSelectedLabel(
  prefix: string,
  option: ReviewRatingOption,
): string {
  return `${prefix} ${option.label}`;
}

function formatReviewDate(
  value: string | Date | null | undefined,
  locale: "es" | "en",
): string {
  const relative = formatRelativeLastAccess(value, locale);
  if (relative != null) return relative;
  return formatDateDdMmYyyyHhMm(value, locale);
}

function StarRatingIcons({
  rating,
  ariaLabel,
}: {
  rating: number;
  ariaLabel: string;
}) {
  const r = Math.min(5, Math.max(0, Math.round(rating)));
  return (
    <div
      className="flex items-center gap-0.5 text-amber-500"
      aria-label={ariaLabel}
    >
      {Array.from({ length: r }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-current" aria-hidden />
      ))}
    </div>
  );
}

function useResponsiveProductReviewsPageSize(): number {
  const [pageSize, setPageSize] = useState(
    PRODUCT_REVIEWS_PAGE_SIZE_MOBILE_TABLET,
  );

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const apply = () => {
      setPageSize(
        media.matches
          ? PRODUCT_REVIEWS_PAGE_SIZE_DESKTOP
          : PRODUCT_REVIEWS_PAGE_SIZE_MOBILE_TABLET,
      );
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return pageSize;
}

function scrollToListStart(el: HTMLElement | null) {
  if (!el) return;
  const stickyHeaderOffset = 110;
  const top = Math.max(
    0,
    el.getBoundingClientRect().top + window.scrollY - stickyHeaderOffset,
  );
  window.scrollTo({ top, behavior: "smooth" });
}

function ProductReviewsSection({
  productName,
  rows,
  onOpenForm,
}: {
  productName: string;
  rows: ProductReviewDetailListItem[];
  onOpenForm: () => void;
}) {
  const { t, locale } = useI18n();
  const pageSize = useResponsiveProductReviewsPageSize();
  const [page, setPage] = useState(1);
  const listTopRef = useRef<HTMLElement | null>(null);
  const [dateSort, setDateSort] = useState<ReviewDateSort>("newest");
  const [ratingFilter, setRatingFilter] = useState<ReviewRatingFilter>("all");

  const reviewDateSortOptions: ReviewDateSortOption[] = [
    { value: "newest", label: t("storefront.productDetail.sortNewest") },
    { value: "oldest", label: t("storefront.productDetail.sortOldest") },
    { value: "best_rating", label: t("storefront.productDetail.sortBest") },
    { value: "worst_rating", label: t("storefront.productDetail.sortWorst") },
  ];

  const reviewRatingOptions: ReviewRatingOption[] = [
    { value: "all", label: t("storefront.productDetail.ratingAll") },
    {
      value: "5",
      label: t("storefront.productDetail.ratingStars").replace("{n}", "5"),
    },
    {
      value: "4",
      label: t("storefront.productDetail.ratingStars").replace("{n}", "4"),
    },
    {
      value: "3",
      label: t("storefront.productDetail.ratingStars").replace("{n}", "3"),
    },
    {
      value: "2",
      label: t("storefront.productDetail.ratingStars").replace("{n}", "2"),
    },
    { value: "1", label: t("storefront.productDetail.ratingStarOne") },
  ];

  const filteredAndSortedRows = [...rows]
    .filter((row) => {
      if (ratingFilter === "all") return true;
      return Math.round(row.rating) === Number(ratingFilter);
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      const safeA = Number.isNaN(dateA) ? 0 : dateA;
      const safeB = Number.isNaN(dateB) ? 0 : dateB;
      switch (dateSort) {
        case "oldest":
          return safeA - safeB;
        case "best_rating":
          return b.rating - a.rating;
        case "worst_rating":
          return a.rating - b.rating;
        case "newest":
        default:
          return safeB - safeA;
      }
    });

  const totalItems = filteredAndSortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * pageSize;
  const pageRows = filteredAndSortedRows.slice(offset, offset + pageSize);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setPage(1);
  }, [dateSort, ratingFilter, rows.length]);

  const clearFilters = () => {
    setDateSort("newest");
    setRatingFilter("all");
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    window.requestAnimationFrame(() => {
      scrollToListStart(listTopRef.current);
    });
  };

  return (
    <section
      ref={listTopRef}
      className="mt-10 rounded-xl border border-border/70 bg-card/80 p-4 sm:p-6 shadow-sm"
    >
      <div className="flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {t("storefront.productDetail.reviewsTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("storefront.productDetail.reviewsAbout").replace(
              "{name}",
              productName,
            )}
          </p>
        </div>
        {rows.length > 0 ? (
          <Button
            size="lg"
            className="h-11 w-full rounded-xl px-6 sm:w-auto"
            onClick={onOpenForm}
          >
            {t("storefront.productDetail.writeReview")}
          </Button>
        ) : null}
      </div>

      {rows.length === 0 ? null : (
        <TooltipProvider delayDuration={300} disableHoverableContent>
          <div className="mt-5 flex flex-wrap items-start gap-3 sm:items-center sm:gap-4">
            <div className="w-full min-w-0 sm:w-auto">
              <div
                className="min-w-0 flex-1 sm:flex-none"
                style={{
                  width: `${PRODUCT_REVIEWS_SELECT_WIDTH_CH}ch`,
                  maxWidth: "100%",
                }}
              >
                <Select<ReviewDateSortOption, false>
                  instanceId="product-detail-reviews-sort"
                  inputId="product-detail-reviews-sort"
                  aria-label={t("storefront.productDetail.reviewsSortAria")}
                  styles={appSelectStyles}
                  options={reviewDateSortOptions}
                  value={
                    reviewDateSortOptions.find(
                      (option) => option.value === dateSort,
                    ) ?? reviewDateSortOptions[0]
                  }
                  onChange={(option) => {
                    if (option) setDateSort(option.value);
                  }}
                  formatOptionLabel={(option, meta) =>
                    meta.context === "value"
                      ? formatSortSelectedLabel(
                          t("storefront.productDetail.reviewsSortPrefix"),
                          option,
                        )
                      : option.label
                  }
                  isClearable={false}
                  isSearchable={false}
                />
              </div>
            </div>
            <div className="w-full min-w-0 sm:w-auto">
              <div
                className="min-w-0 flex-1 sm:flex-none"
                style={{
                  width: `${PRODUCT_REVIEWS_SELECT_WIDTH_CH}ch`,
                  maxWidth: "100%",
                }}
              >
                <Select<ReviewRatingOption, false>
                  instanceId="product-detail-reviews-rating"
                  inputId="product-detail-reviews-rating"
                  aria-label={t("storefront.productDetail.reviewsRatingAria")}
                  styles={appSelectStyles}
                  options={reviewRatingOptions}
                  value={
                    reviewRatingOptions.find(
                      (option) => option.value === ratingFilter,
                    ) ?? reviewRatingOptions[0]
                  }
                  onChange={(option) => {
                    if (option) setRatingFilter(option.value);
                  }}
                  formatOptionLabel={(option, meta) =>
                    meta.context === "value"
                      ? formatRatingSelectedLabel(
                          t("storefront.productDetail.reviewsRatingPrefix"),
                          option,
                        )
                      : option.label
                  }
                  isClearable={false}
                  isSearchable={false}
                />
              </div>
            </div>
            {ratingFilter !== "all" ? (
              <div className="w-full sm:w-auto">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-auto justify-start gap-2 rounded-lg border-border/80 bg-card px-3 text-sm shadow-sm transition hover:bg-muted/50 sm:w-10 sm:px-0 sm:justify-center sm:gap-0"
                      onClick={clearFilters}
                      aria-label={t(
                        "storefront.productDetail.reviewsClearFilters",
                      )}
                    >
                      <FilterX className="h-4 w-4" aria-hidden />
                      <span className="sm:hidden">
                        {t("storefront.productDetail.reviewsClearFilters")}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="center"
                    className={TABLE_LIKE_TOOLTIP_CLASS}
                  >
                    <span className="font-medium">
                      {t("storefront.productDetail.reviewsClearFilters")}
                    </span>
                  </TooltipContent>
                </Tooltip>
              </div>
            ) : null}
          </div>
        </TooltipProvider>
      )}

      {rows.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border/60 bg-muted/70 px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {t("storefront.productDetail.reviewsEmpty")}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={onOpenForm}
            className="mt-4 inline-flex h-11 shrink-0 rounded-2xl border-primary/30 bg-card px-5 font-semibold text-primary hover:bg-primary/5"
          >
            {t("storefront.productDetail.writeFirstReview")}
          </Button>
        </div>
      ) : filteredAndSortedRows.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-border/60 bg-muted/70 px-6 py-10 text-center text-sm text-muted-foreground">
          {t("storefront.productDetail.reviewsNoMatch")}{" "}
          <button
            type="button"
            onClick={clearFilters}
            className="font-semibold text-black underline underline-offset-2 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
          >
            {t("storefront.productDetail.reviewsClearAll")}
          </button>
        </p>
      ) : (
        <>
          <ul className="mt-6 grid list-none gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pageRows.map((row) => (
              <li key={row.id}>
                <article className="flex h-full flex-col rounded-3xl border border-border/50 bg-card p-5 shadow-soft sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <StarRatingIcons
                      rating={row.rating}
                      ariaLabel={t(
                        "storefront.productDetail.starsAria",
                      ).replace(
                        "{n}",
                        String(
                          Math.min(5, Math.max(0, Math.round(row.rating))),
                        ),
                      )}
                    />
                    <CheckCircle2
                      className="h-5 w-5 shrink-0 text-primary"
                      aria-hidden
                    />
                  </div>
                  {row.comment ? (
                    <blockquote className="mt-4 flex-1 border-l-2 border-primary/35 pl-4 text-sm italic leading-relaxed text-muted-foreground">
                      {row.comment}
                    </blockquote>
                  ) : (
                    <p className="mt-4 flex-1 text-sm italic text-muted-foreground">
                      {t("storefront.productDetail.reviewsNoComment")}
                    </p>
                  )}
                  <p className="mt-5 text-sm font-semibold text-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <UserRound
                        className="h-4 w-4 text-primary/85"
                        aria-hidden
                      />
                      {row.reviewerLabel}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatReviewDate(row.createdAt, locale)}
                  </p>
                </article>
              </li>
            ))}
          </ul>

          {totalItems > pageSize ? (
            <nav
              className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border/70 pt-6 sm:flex-row"
              aria-label={t("storefront.productDetail.reviewsPaginationAria")}
            >
              <p className="text-sm text-muted-foreground">
                {t("storefront.productDetail.reviewsShowing")}{" "}
                <span className="tabular-nums text-foreground">
                  {offset + 1}–{Math.min(offset + pageSize, totalItems)}
                </span>{" "}
                {t("storefront.productDetail.reviewsOf")}{" "}
                <span className="tabular-nums text-foreground">
                  {totalItems}
                </span>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={safePage <= 1}
                  onClick={() => handlePageChange(Math.max(1, safePage - 1))}
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
                  {t("storefront.productDetail.reviewsPrev")}
                </Button>
                <span className="min-w-[4.5rem] text-center text-sm tabular-nums text-muted-foreground">
                  {safePage} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={safePage >= totalPages}
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, safePage + 1))
                  }
                >
                  {t("storefront.productDetail.reviewsNext")}
                  <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
                </Button>
              </div>
            </nav>
          ) : null}
        </>
      )}
    </section>
  );
}

function ProductDescriptionCollapsible({
  description,
  title,
}: ProductDescriptionCollapsibleProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const heading = title ?? t("storefront.productDetail.descriptionTitle");

  return (
    <section className="overflow-hidden rounded-xl border border-border/70 bg-card/90 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={
          open
            ? t("storefront.productDetail.collapseSection").replace(
                "{title}",
                heading,
              )
            : t("storefront.productDetail.expandSection").replace(
                "{title}",
                heading,
              )
        }
        className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:py-4 text-left transition hover:bg-card/80"
      >
        <span className="text-base font-semibold uppercase tracking-wider text-muted-foreground">
          {heading}
        </span>
        {open ? (
          <Minus className="h-5 w-5 text-muted-foreground" aria-hidden />
        ) : (
          <Plus className="h-5 w-5 text-muted-foreground" aria-hidden />
        )}
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border/70 px-6 py-2">
            <ProductDescriptionViewer
              descripcion={description}
              className="[&>:last-child]:mb-0"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductSpecsContent({ specifications }: { specifications: string }) {
  return (
    <div className="min-w-0 max-w-full overflow-x-auto">
      <ProductDescriptionViewer
        descripcion={specifications}
        className="storefront-product-specs max-w-full break-words [&_img]:max-w-full"
      />
    </div>
  );
}

function ProductManualDownloadLink({ href }: { href: string }) {
  const { t } = useI18n();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-3 rounded-xl border border-dashed border-primary/35 bg-primary/[0.04] px-5 py-4 text-sm font-medium text-primary transition hover:bg-primary/[0.08]"
    >
      <FileText className="h-5 w-5 shrink-0" strokeWidth={1.75} />
      <span>{t("storefront.productDetail.downloadManual")}</span>
    </a>
  );
}

function ProductInformationTabsSection({
  specifications,
  manualPdfUrl,
}: {
  specifications: string | null;
  manualPdfUrl: string | null;
}) {
  const { t } = useI18n();
  const specsHtml = specifications?.trim() || "";
  const manualHref = manualPdfUrl?.trim() || "";
  const hasSpecs = hasPublishedRichHtml(specsHtml);
  const hasDownloads = Boolean(manualHref);

  const [activeTab, setActiveTab] = useState<ProductInfoTabId>(
    hasSpecs ? "technical_specs" : "downloads",
  );

  if (!hasSpecs && !hasDownloads) return null;

  const showTabs = hasSpecs && hasDownloads;
  const heading = hasSpecs
    ? t("storefront.productDetail.specsTab")
    : t("storefront.productDetail.downloadsTab");

  return (
    <section className="mt-10 rounded-xl border border-border/70 bg-card/80 p-4 shadow-sm sm:mt-14 sm:p-6">
      {showTabs ? (
        <div
          className="-mx-4 flex min-w-0 gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain border-b border-border/60 bg-transparent px-4 pb-3 pt-1 shadow-[0_1px_0_0_rgba(0,0,0,0.08)] [scrollbar-width:thin] sm:mx-0 sm:px-0 sm:pt-0"
          role="tablist"
          aria-label={t("storefront.productDetail.infoTabsAria")}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "technical_specs"}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition",
              activeTab === "technical_specs"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border/80 bg-white/60 text-muted-foreground shadow-sm hover:bg-muted/30 hover:text-foreground dark:bg-card",
            )}
            onClick={() => setActiveTab("technical_specs")}
          >
            {t("storefront.productDetail.specsTab")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "downloads"}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition",
              activeTab === "downloads"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border/80 bg-white/60 text-muted-foreground shadow-sm hover:bg-muted/30 hover:text-foreground dark:bg-card",
            )}
            onClick={() => setActiveTab("downloads")}
          >
            {t("storefront.productDetail.downloadsTab")}
          </button>
        </div>
      ) : (
        <h2 className="border-b border-border/60 pb-3 text-base font-semibold text-foreground">
          {heading}
        </h2>
      )}

      <div className="mt-4" role={showTabs ? "tabpanel" : undefined}>
        {showTabs ? (
          activeTab === "technical_specs" ? (
            <ProductSpecsContent specifications={specsHtml} />
          ) : (
            <ProductManualDownloadLink href={manualHref} />
          )
        ) : hasSpecs ? (
          <ProductSpecsContent specifications={specsHtml} />
        ) : (
          <ProductManualDownloadLink href={manualHref} />
        )}
      </div>
    </section>
  );
}

export function StorefrontProductDetailView({
  product,
  priceTier,
  initialProductReviews,
  similarProducts,
  accessoryProducts,
}: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [cartQty, setCartQty] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [reviewPanelOpen, setReviewPanelOpen] = useState(false);
  const [reviewFormPending, setReviewFormPending] = useState(false);
  const images = product.images;
  const hasImages = images.length > 0;

  const pct = activeDiscountPercent(product, priceTier);
  const listPrice = resolveStorefrontBasePrice(product, priceTier);
  const sale = resolveStorefrontUnitPrice(product, priceTier);
  const showCompare = pct > 0 && sale < listPrice;
  const stockUi = stockBadgeClass(product.stock, locale);
  const canBuy = product.stock > 0;
  const maxCartQty = Math.max(1, product.stock);
  const isNew = isNewFromCreatedAt(product.created_at);
  const descriptionForLocale = resolveLocalizedRichHtml(
    locale,
    product.description,
    product.description_en,
  );
  const hasDescription = Boolean(descriptionForLocale);
  const specificationsForLocale = resolveLocalizedRichHtml(
    locale,
    product.specifications,
    product.specifications_en,
  );
  const displayName = storefrontProductDisplayName(product, locale);
  const displayBrandName = storefrontLocalizedText(
    locale,
    product.brand_name,
    product.brand_name_en,
  );
  const displayBrandTypeName = storefrontLocalizedText(
    locale,
    product.brand_type_name,
    product.brand_type_name_en,
  );

  useEffect(() => {
    setCartQty(1);
    setActiveIdx(0);
  }, [product.id]);

  useEffect(() => {
    setCartQty((q) => Math.min(maxCartQty, Math.max(1, q)));
  }, [maxCartQty]);

  const imageCount = images.length;
  const canNavigateImages = imageCount > 1;

  const goToPrevImage = () => {
    if (!canNavigateImages) return;
    setActiveIdx((i) => (i === 0 ? imageCount - 1 : i - 1));
  };

  const goToNextImage = () => {
    if (!canNavigateImages) return;
    setActiveIdx((i) => (i === imageCount - 1 ? 0 : i + 1));
  };

  useEffect(() => {
    if (!lightboxOpen || !canNavigateImages) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActiveIdx((i) => (i === 0 ? imageCount - 1 : i - 1));
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setActiveIdx((i) => (i === imageCount - 1 ? 0 : i + 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, canNavigateImages, imageCount]);

  const brandSlug = product.brand_slug;
  const brandHref = `/brands/${brandSlug}`;
  const brandTypeHref =
    product.brand_type_id && product.brand_type_slug
      ? `${brandHref}/${product.brand_type_slug}`
      : null;

  const handleReviewSuccess = () => {
    setReviewPanelOpen(false);
    router.refresh();
  };

  return (
    <div className={cn(inter.className)}>
      <div className="grid w-full items-start gap-4 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:gap-10">
        <div className="min-w-0 w-full space-y-5">
          <div
            className={cn(
              "grid gap-1 md:gap-3",
              hasImages &&
                canNavigateImages &&
                "md:grid-cols-[5rem_minmax(0,1fr)] md:items-stretch",
            )}
          >
            {/* Imagen principal: arriba en móvil; columna derecha desde md si hay galería */}
            <div
              className={cn(
                "min-w-0 max-md:order-1",
                hasImages &&
                  canNavigateImages &&
                  "md:col-start-2 md:row-start-1",
              )}
            >
              {hasImages ? (
                <div className="relative w-full">
                  <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
                    <button
                      type="button"
                      className="group relative w-full cursor-pointer overflow-hidden rounded-xl text-left ring-offset-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      aria-haspopup="dialog"
                      aria-expanded={lightboxOpen}
                      aria-label={t("storefront.productDetail.zoomImageAria")}
                      onClick={() => setLightboxOpen(true)}
                    >
                      <div className="relative aspect-square w-full overflow-hidden rounded-xl">
                        <Image
                          src={images[activeIdx].url}
                          alt={displayName}
                          fill
                          className="object-cover object-center transition duration-300 ease-out group-hover:scale-[1.02]"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 65vw, 50vw"
                          priority
                        />
                        <div
                          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/35 via-black/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                          aria-hidden
                        >
                          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background/85 text-foreground shadow-lg ring-1 ring-white/25 backdrop-blur-md transition duration-200 group-hover:scale-105 dark:bg-background/75 dark:ring-white/10">
                            <ZoomIn
                              className="h-7 w-7"
                              strokeWidth={1.5}
                              aria-hidden
                            />
                          </span>
                        </div>
                      </div>
                    </button>
                    <DialogContent
                      className={cn(
                        "flex max-h-[90vh] w-full max-w-[min(90vw,1200px)] translate-x-[-50%] translate-y-[-50%] flex-col gap-0 overflow-y-auto border-0 bg-transparent p-0 shadow-none sm:rounded-none",
                        /* Botón cerrar (Radix): esquina superior derecha, más grande que el default */
                        "[&>button]:right-0 [&>button]:top-0 [&>button]:z-[70] [&>button]:flex [&>button]:h-8 [&>button]:w-8 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:border [&>button]:border-border/50 [&>button]:bg-background/95 [&>button]:p-0 [&>button]:opacity-100 [&>button]:shadow-md [&>button]:ring-offset-0 [&>button>svg]:h-[1.125rem] [&>button>svg]:w-[1.125rem] sm:[&>button]:right-1 sm:[&>button]:top-1",
                      )}
                    >
                      <DialogTitle className="sr-only">
                        {t("storefront.productDetail.zoomImageTitle").replace(
                          "{name}",
                          displayName,
                        )}
                      </DialogTitle>
                      <div className="relative h-[min(85vh,90vw)] w-full min-h-[12rem]">
                        <Image
                          src={images[activeIdx].url}
                          alt={displayName}
                          fill
                          className="object-contain"
                          sizes="90vw"
                          priority={lightboxOpen}
                        />
                        {canNavigateImages ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                goToPrevImage();
                              }}
                              className="absolute left-2 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background/95 text-foreground shadow-md backdrop-blur-sm transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:left-4"
                              aria-label={t(
                                "storefront.productDetail.prevImageAria",
                              )}
                            >
                              <ChevronLeft
                                className="h-6 w-6"
                                strokeWidth={2}
                                aria-hidden
                              />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                goToNextImage();
                              }}
                              className="absolute right-2 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background/95 text-foreground shadow-md backdrop-blur-sm transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:right-4"
                              aria-label={t(
                                "storefront.productDetail.nextImageAria",
                              )}
                            >
                              <ChevronRight
                                className="h-6 w-6"
                                strokeWidth={2}
                                aria-hidden
                              />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </DialogContent>
                  </Dialog>
                  {canNavigateImages ? (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          goToPrevImage();
                        }}
                        className="absolute left-2 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background/95 text-foreground shadow-md backdrop-blur-sm transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:left-3"
                        aria-label={t("storefront.productDetail.prevImageAria")}
                      >
                        <ChevronLeft
                          className="h-5 w-5"
                          strokeWidth={2}
                          aria-hidden
                        />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          goToNextImage();
                        }}
                        className="absolute right-2 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background/95 text-foreground shadow-md backdrop-blur-sm transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:right-3"
                        aria-label={t("storefront.productDetail.nextImageAria")}
                      >
                        <ChevronRight
                          className="h-5 w-5"
                          strokeWidth={2}
                          aria-hidden
                        />
                      </button>
                    </>
                  ) : null}
                </div>
              ) : (
                <div className="relative aspect-square w-full">
                  <div
                    className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl border border-border/70 bg-card/90 p-6 text-center text-muted-foreground shadow-sm"
                    role="img"
                    aria-label={t("storefront.card.imageMissingAria")}
                  >
                    <ImageOff
                      className="h-16 w-16 shrink-0 opacity-50"
                      strokeWidth={1.25}
                      aria-hidden
                    />
                    <span className="text-sm font-medium">
                      {t("storefront.card.imageMissingSr")}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {hasImages && canNavigateImages ? (
              <div
                className={cn(
                  "flex w-full min-w-0 gap-2",
                  "max-md:order-2 max-md:flex-row max-md:overflow-x-auto max-md:overflow-y-hidden max-md:overscroll-x-contain max-md:pb-1",
                  "md:col-start-1 md:row-start-1 md:h-full md:min-h-0 md:max-h-full md:flex-col md:overflow-x-hidden md:overflow-y-auto md:overscroll-y-contain md:pb-0",
                )}
              >
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveIdx(i)}
                    className={cn(
                      "relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-muted/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      i === activeIdx
                        ? "border-primary opacity-100"
                        : "border-transparent opacity-70 hover:opacity-100",
                    )}
                    aria-label={t(
                      "storefront.productDetail.viewImageAria",
                    ).replace("{n}", String(i + 1))}
                    aria-pressed={i === activeIdx}
                  >
                    <Image
                      src={img.url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {hasDescription ? (
            <div className="hidden lg:block">
              <ProductDescriptionCollapsible
                description={descriptionForLocale ?? ""}
              />
            </div>
          ) : null}
        </div>

        <div className="min-w-0 w-full space-y-6 lg:sticky lg:top-28">
          <div>
            {pct > 0 || isNew ? (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {pct > 0 ? (
                  <span
                    className={cn(
                      inter.className,
                      "rounded-full bg-gradient-to-br from-rose-600 to-red-600 px-2 py-[2px] text-[11px] font-semibold tabular-nums text-white shadow-md ring-2 ring-white/25 sm:text-[12px]",
                    )}
                    aria-label={t("storefront.card.discountAria").replace(
                      "{pct}",
                      String(Math.round(pct)),
                    )}
                  >
                    −{Math.round(pct)}%
                  </span>
                ) : null}
                {isNew ? (
                  <span
                    className={cn(
                      inter.className,
                      "rounded-full bg-emerald-600 px-2 py-[2px] text-[11px] font-semibold text-white shadow-md ring-2 ring-white/25 sm:text-[12px]",
                    )}
                  >
                    {t("storefront.card.newBadge")}
                  </span>
                ) : null}
              </div>
            ) : null}
            <h1
              className={cn(
                pct > 0 || isNew ? "mt-2" : "mt-0",
                "text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl",
              )}
            >
              {displayName}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 text-left text-[13px] font-medium leading-tight text-muted-foreground sm:text-sm">
              <Link href={brandHref} className="transition hover:text-primary">
                {displayBrandName}
              </Link>
              {displayBrandTypeName && displayBrandTypeName !== "—" ? (
                <>
                  <span
                    className="inline-block h-3 w-px shrink-0 bg-muted-foreground/55"
                    aria-hidden
                  />
                  {brandTypeHref ? (
                    <Link
                      href={brandTypeHref}
                      className="transition hover:text-primary"
                    >
                      {displayBrandTypeName}
                    </Link>
                  ) : (
                    <span>{displayBrandTypeName}</span>
                  )}
                </>
              ) : null}
            </p>
            <p className="mt-3 text-sm tabular-nums text-muted-foreground font-medium">
              {t("storefront.productDetail.skuLabel")}:{" "}
              <span className="text-foreground">{product.sku}</span>
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-card/80 p-4 sm:p-6 shadow-sm backdrop-blur-sm">
            {showCompare ? (
              <div className="flex w-full flex-col gap-2">
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                  <span className="text-2xl font-bold tabular-nums leading-none text-primary">
                    {formatUsd(sale)}
                  </span>
                  <span className="text-lg tabular-nums text-muted-foreground line-through decoration-2 decoration-muted-foreground/70">
                    {formatUsd(listPrice)}
                  </span>
                </div>
                <span
                  className={cn(
                    "inline-flex w-fit max-w-full items-center rounded-full border px-2.5 py-0.5 text-left text-[12px] font-medium leading-snug sm:text-[13px]",
                    stockUi.cardLabelClassName,
                  )}
                >
                  {stockUi.label}
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <span className="text-2xl font-bold tabular-nums leading-none text-primary">
                  {formatUsd(sale)}
                </span>
                <span
                  className={cn(
                    "inline-flex w-fit max-w-full items-center rounded-full border px-2.5 py-0.5 text-left text-[12px] font-medium leading-snug sm:text-[13px]",
                    stockUi.cardLabelClassName,
                  )}
                >
                  {stockUi.label}
                </span>
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {t("storefront.productDetail.priceByProfile").replace(
                "{tier}",
                priceTier === "business"
                  ? t("storefront.productDetail.priceTierBusiness")
                  : t("storefront.productDetail.priceTierClient"),
              )}
            </p>

            <div
              className={cn(
                "mt-6 flex flex-col gap-3",
                "sm:flex-row sm:items-stretch sm:gap-3",
              )}
            >
              <StoreQuantityStepper
                value={cartQty}
                max={maxCartQty}
                disabled={!canBuy}
                className="sm:min-w-[7.25rem]"
                onChange={setCartQty}
              />

              <ButtonPending
                type="button"
                size="lg"
                disabled={!canBuy}
                pending={isAddingToCart}
                pendingLabel={t("storefront.card.addingPending")}
                skipMinWidth
                className="h-12 w-full rounded-xl text-base font-semibold shadow-sm sm:min-w-0 sm:flex-1"
                onClick={async () => {
                  if (!canBuy) {
                    toast.info(t("storefront.card.toastNoStock"));
                    return;
                  }
                  setIsAddingToCart(true);
                  try {
                    await new Promise((resolve) =>
                      window.setTimeout(resolve, 220),
                    );
                    await gcCartAddProduct(product.id, cartQty);
                    setCartQty(1);
                  } catch (error) {
                    const message =
                      error instanceof Error
                        ? error.message
                        : t("storefront.card.toastAddError");
                    toast.error(message);
                  } finally {
                    setIsAddingToCart(false);
                  }
                }}
              >
                {canBuy
                  ? t("storefront.card.addToCart")
                  : t("storefront.card.outOfStock")}
              </ButtonPending>
            </div>
          </div>

          {product.shipping_type === "non_standard" ? (
            <div
              role="status"
              className="rounded-xl border border-primary/25 border-l-[3px] border-l-primary bg-[color-mix(in_srgb,#357fd2_9%,white)] px-3.5 py-3 text-xs leading-relaxed shadow-sm"
            >
              <div className="flex items-start gap-1.5">
                <Info
                  className="mt-px h-3.5 w-3.5 shrink-0 text-primary"
                  strokeWidth={2.25}
                  aria-hidden
                />
                <div className="min-w-0 space-y-1.5">
                  <p className="font-semibold leading-snug break-words text-primary">
                    {t("storefront.productDetail.specialShippingTitle")}
                  </p>
                  <p className="leading-relaxed text-primary/85">
                    {t("storefront.productDetail.specialShippingDescription")}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {product.manual_pdf_url ? (
            <a
              href={product.manual_pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-dashed border-primary/35 bg-primary/[0.04] px-5 py-4 text-sm font-medium text-primary transition hover:bg-primary/[0.08]"
            >
              <FileText className="h-5 w-5 shrink-0" strokeWidth={1.75} />
              <span>{t("storefront.productDetail.downloadManual")}</span>
            </a>
          ) : null}

          {hasDescription ? (
            <div className="lg:hidden">
              <ProductDescriptionCollapsible
                description={descriptionForLocale ?? ""}
              />
            </div>
          ) : null}

          {/*
            Sección ocultada temporalmente por solicitud.
            Para reactivar, descomentar este bloque.
          {charGroups.length > 0 ? (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Especificaciones
              </h2>
              <div className="space-y-6">
                {charGroups.map(([general, rows]) => (
                  <div
                    key={general}
                    className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
                  >
                    <div className="border-b border-border/60 bg-muted/40 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {general}
                    </div>
                    <dl className="divide-y divide-border/50">
                      {rows.map((row) => (
                        <div
                          key={row.id}
                          className="grid gap-1 px-4 py-3 sm:grid-cols-5 sm:gap-4"
                        >
                          <dt className="text-sm text-muted-foreground sm:col-span-2">
                            {row.specificName}
                          </dt>
                          <dd className="text-sm font-medium text-foreground sm:col-span-3">
                            {row.value?.trim() ? row.value : "—"}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
          */}
        </div>
      </div>
      {accessoryProducts.length > 0 ? (
        <div
          className={cn(
            "mt-12 bg-[rgb(229,231,235)] shadow-none ring-0 sm:mt-14",
            "-mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8",
          )}
        >
          <SimilarProducts
            products={accessoryProducts}
            priceTier={priceTier}
            title={t("storefront.productDetail.accessoriesTitle")}
            subtitle={t("storefront.productDetail.accessoriesSubtitle")}
          />
        </div>
      ) : null}
      {similarProducts.length > 0 ? (
        <div
          className={cn(
            "mt-12 bg-[rgb(229,231,235)] shadow-none ring-0 sm:mt-14",
            "-mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8",
          )}
        >
          <SimilarProducts
            productId={product.id}
            categoriaId={product.category_id}
            subcategoryId={product.subcategory_id}
            marcaId={product.brand_id}
            tipoProductoId={product.brand_type_id}
            precio={product.price_client}
            products={similarProducts}
            priceTier={priceTier}
          />
        </div>
      ) : null}
      {specificationsForLocale || product.manual_pdf_url?.trim() ? (
        <ProductInformationTabsSection
          specifications={specificationsForLocale}
          manualPdfUrl={product.manual_pdf_url}
        />
      ) : null}

      <ProductReviewsSection
        productName={displayName}
        rows={initialProductReviews}
        onOpenForm={() => setReviewPanelOpen(true)}
      />
      <SlideOver
        open={reviewPanelOpen}
        onClose={() => setReviewPanelOpen(false)}
        title={t("storefront.productDetail.reviewPanelTitle")}
        description={
          <>
            {t("storefront.productDetail.reviewPanelDescription")
              .split("{name}")
              .map((part, index, parts) =>
                index < parts.length - 1 ? (
                  <span key={index}>
                    {part}
                    <span className="font-medium text-foreground">
                      {displayName}
                    </span>
                  </span>
                ) : (
                  <span key={index}>{part}</span>
                ),
              )}
          </>
        }
        panelClassName="lg:max-w-[min(32rem,92vw)]"
        contentAriaLabel={t("storefront.productDetail.reviewPanelAria")}
        footer={
          <SlideOverFooter>
            <Button
              type="button"
              variant="outline"
              disabled={reviewFormPending}
              onClick={() => setReviewPanelOpen(false)}
            >
              {t("storefront.productDetail.reviewCancel")}
            </Button>
            <ButtonPending
              type="submit"
              form={PRODUCT_REVIEW_FORM_ID}
              pending={reviewFormPending}
              pendingLabel={t("storefront.productDetail.reviewSending")}
            >
              {t("storefront.productDetail.reviewSubmit")}
            </ButtonPending>
          </SlideOverFooter>
        }
      >
        <ProductReviewForm
          key={reviewPanelOpen ? "open" : "closed"}
          productId={product.id}
          productName={displayName}
          onSuccess={handleReviewSuccess}
          onPendingChange={setReviewFormPending}
        />
      </SlideOver>
    </div>
  );
}
