"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, FilterX, Star } from "lucide-react";
import Select from "react-select";
import { Button } from "@/components/ui/button";
import { ButtonPending } from "@/components/ui/button-pending";
import { appSelectStyles } from "@/components/ui/react-select-app-styles";
import { SlideOver, SlideOverFooter } from "@/components/ui/slide-over";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LeaveReviewForm,
  LEAVE_REVIEW_SITE_FORM_ID,
} from "@/components/site/LeaveReviewForm";
import { cn } from "@/utils/cn";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { formatRelativeLastAccess } from "@/utils/formatRelativeLastAccess";
import type {
  ProductReviewListItem,
  SiteReviewListItem,
} from "@/modules/site/leave-review-data.service";

type TabId = "products" | "site";

const tabs: { id: TabId; label: string }[] = [
  { id: "products", label: "Reseñas de productos" },
  { id: "site", label: "Reseñas de la tienda" },
];

const REVIEWS_PAGE_SIZE = 6;
const REVIEWS_SORT_SELECT_WIDTH_CH = 24;

type ReviewDateSort = "newest" | "oldest";
type ReviewRatingFilter = "all" | "5" | "4" | "3" | "2" | "1";

type ReviewDateSortOption = { value: ReviewDateSort; label: string };
type ReviewRatingOption = { value: ReviewRatingFilter; label: string };

const reviewDateSortOptions: ReviewDateSortOption[] = [
  { value: "newest", label: "Ordenar por: Más reciente" },
  { value: "oldest", label: "Ordenar por: Más antigua" },
];

const reviewRatingOptions: ReviewRatingOption[] = [
  { value: "all", label: "Valoración: Todas" },
  { value: "5", label: "Valoración: 5 estrellas" },
  { value: "4", label: "Valoración: 4 estrellas" },
  { value: "3", label: "Valoración: 3 estrellas" },
  { value: "2", label: "Valoración: 2 estrellas" },
  { value: "1", label: "Valoración: 1 estrella" },
];

const TABLE_LIKE_TOOLTIP_CLASS =
  "rounded-xl border border-border/60 bg-popover px-3 py-2 text-[11px] text-popover-foreground shadow-xl";

/** Misma tarjeta que la sección «Historias reales» del home (`app/page.tsx`). */
const reviewStoryCardClassName =
  "flex flex-col rounded-3xl border border-border/50 bg-card p-5 shadow-soft sm:p-6";

/** Fecha como en tablas del panel: relativa (p. ej. ayer, hace 3 horas) o absoluta si aplica. */
function formatReviewDate(value: string | Date | null | undefined): string {
  const relative = formatRelativeLastAccess(value);
  if (relative != null) return relative;
  return formatDateDdMmYyyyHhMm(value);
}

function SimplePaginationBar({
  page,
  totalPages,
  totalItems,
  onPageChange,
  idPrefix,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (p: number) => void;
  idPrefix: string;
}) {
  if (totalItems <= REVIEWS_PAGE_SIZE) return null;

  const start = (page - 1) * REVIEWS_PAGE_SIZE + 1;
  const end = Math.min(page * REVIEWS_PAGE_SIZE, totalItems);

  return (
    <nav
      className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border/70 pt-6 sm:flex-row"
      aria-label="Paginación de reseñas"
    >
      <p id={`${idPrefix}-range`} className="text-sm text-muted-foreground">
        Mostrando{" "}
        <span className="tabular-nums text-foreground">
          {start}–{end}
        </span>{" "}
        de <span className="tabular-nums text-foreground">{totalItems}</span>
      </p>
      <div
        className="flex items-center gap-2"
        role="group"
        aria-labelledby={`${idPrefix}-range`}
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
          Anterior
        </Button>
        <span className="min-w-[4.5rem] text-center text-sm tabular-nums text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Página siguiente"
        >
          Siguiente
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        </Button>
      </div>
    </nav>
  );
}

function StarRatingIcons({ rating }: { rating: number }) {
  const r = Math.min(5, Math.max(0, Math.round(rating)));
  return (
    <div
      className="flex items-center gap-0.5 text-amber-500"
      aria-label={`${r} de 5 estrellas`}
    >
      {Array.from({ length: r }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-current" aria-hidden />
      ))}
    </div>
  );
}

function ReviewsFiltersToolbar({
  idPrefix,
  dateSort,
  ratingFilter,
  onDateSortChange,
  onRatingFilterChange,
  onClearRatingFilter,
}: {
  idPrefix: string;
  dateSort: ReviewDateSort;
  ratingFilter: ReviewRatingFilter;
  onDateSortChange: (value: ReviewDateSort) => void;
  onRatingFilterChange: (value: ReviewRatingFilter) => void;
  onClearRatingFilter: () => void;
}) {
  return (
    <TooltipProvider delayDuration={300} disableHoverableContent>
      <div className="mb-6 flex flex-wrap items-center gap-3 sm:gap-4">
        <div className="w-full min-w-0 sm:w-auto">
          <div
            className="min-w-0 flex-1 sm:flex-none"
            style={{ width: `${REVIEWS_SORT_SELECT_WIDTH_CH}ch` }}
          >
            <Select<ReviewDateSortOption, false>
              instanceId={`${idPrefix}-toolbar-sort`}
              inputId={`${idPrefix}-toolbar-sort`}
              aria-label="Ordenar reseñas por fecha"
              styles={appSelectStyles}
              options={reviewDateSortOptions}
              value={
                reviewDateSortOptions.find((option) => option.value === dateSort) ??
                reviewDateSortOptions[0]
              }
              onChange={(option) => {
                if (option) onDateSortChange(option.value);
              }}
              isClearable={false}
              isSearchable={false}
            />
          </div>
        </div>
        <div className="w-full min-w-0 sm:w-auto">
          <div
            className="min-w-0 flex-1 sm:flex-none"
            style={{ width: `${REVIEWS_SORT_SELECT_WIDTH_CH}ch` }}
          >
            <Select<ReviewRatingOption, false>
              instanceId={`${idPrefix}-toolbar-rating`}
              inputId={`${idPrefix}-toolbar-rating`}
              aria-label="Filtrar reseñas por valoración"
              styles={appSelectStyles}
              options={reviewRatingOptions}
              value={
                reviewRatingOptions.find((option) => option.value === ratingFilter) ??
                reviewRatingOptions[0]
              }
              onChange={(option) => {
                if (option) onRatingFilterChange(option.value);
              }}
              isClearable={false}
              isSearchable={false}
            />
          </div>
        </div>
        {ratingFilter !== "all" ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-lg border-border/80 bg-card shadow-sm transition hover:bg-muted/50"
                onClick={onClearRatingFilter}
                aria-label="Limpiar filtros"
              >
                <FilterX className="h-4 w-4" aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" align="center" className={TABLE_LIKE_TOOLTIP_CLASS}>
              <span className="font-medium">Limpiar filtros</span>
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
    </TooltipProvider>
  );
}

type Props = {
  initialProductReviews: ProductReviewListItem[];
  initialSiteReviews: SiteReviewListItem[];
};

export function LeaveReviewPageClient({
  initialProductReviews,
  initialSiteReviews,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("products");
  const [panelOpen, setPanelOpen] = useState(false);
  const [reviewFormPending, setReviewFormPending] = useState(false);

  const handleReviewSuccess = () => {
    setPanelOpen(false);
    router.refresh();
  };

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div
          className="flex flex-wrap gap-2 border-b border-border/70 pb-3"
          role="tablist"
          aria-label="Tipo de reseñas"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                activeTab === t.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border/80 bg-white/60 text-muted-foreground shadow-sm hover:bg-muted/30 hover:text-foreground dark:bg-card",
              )}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6 min-h-[12rem]" role="tabpanel">
          {activeTab === "products" ? (
            <ProductReviewsList rows={initialProductReviews} />
          ) : (
            <SiteReviewsSection
              rows={initialSiteReviews}
              onOpenForm={() => setPanelOpen(true)}
            />
          )}
        </div>
      </div>

      <SlideOver
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title="Deja una reseña"
        description="Opina sobre tu experiencia de compra en la tienda. Si inicias sesión, podemos asociar tu comentario a tu cuenta."
        panelClassName="lg:max-w-[min(32rem,92vw)]"
        contentAriaLabel="Formulario de reseña de la tienda"
        footer={
          <SlideOverFooter>
            <Button
              type="button"
              variant="outline"
              disabled={reviewFormPending}
              onClick={() => setPanelOpen(false)}
            >
              Cancelar
            </Button>
            <ButtonPending
              type="submit"
              form={LEAVE_REVIEW_SITE_FORM_ID}
              pending={reviewFormPending}
              pendingLabel="Enviando"
            >
              Enviar reseña
            </ButtonPending>
          </SlideOverFooter>
        }
      >
        <LeaveReviewForm
          key={panelOpen ? "open" : "closed"}
          variant="panel"
          onSuccess={handleReviewSuccess}
          onPendingChange={setReviewFormPending}
        />
      </SlideOver>
    </>
  );
}

function ProductReviewsList({ rows }: { rows: ProductReviewListItem[] }) {
  const [page, setPage] = useState(1);
  const [dateSort, setDateSort] = useState<ReviewDateSort>("newest");
  const [ratingFilter, setRatingFilter] = useState<ReviewRatingFilter>("all");
  const clearFilters = () => {
    setDateSort("newest");
    setRatingFilter("all");
  };

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
      return dateSort === "newest" ? safeB - safeA : safeA - safeB;
    });

  const totalItems = filteredAndSortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / REVIEWS_PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setPage(1);
  }, [rows.length]);

  useEffect(() => {
    setPage(1);
  }, [dateSort, ratingFilter]);

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-10 text-center text-sm leading-relaxed text-muted-foreground">
        Todavía no hay reseñas de productos publicadas. Cuando los clientes
        opinen sobre un artículo, aparecerán aquí.
      </p>
    );
  }

  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * REVIEWS_PAGE_SIZE;
  const pageRows = filteredAndSortedRows.slice(offset, offset + REVIEWS_PAGE_SIZE);

  return (
    <>
      <ReviewsFiltersToolbar
        idPrefix="product-reviews"
        dateSort={dateSort}
        ratingFilter={ratingFilter}
        onDateSortChange={setDateSort}
        onRatingFilterChange={setRatingFilter}
        onClearRatingFilter={() => setRatingFilter("all")}
      />
      {filteredAndSortedRows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-10 text-center text-sm leading-relaxed text-muted-foreground">
          Ninguna reseña coincide con los filtros. Ajusta los criterios para ver
          más resultados o{" "}
          <button
            type="button"
            onClick={clearFilters}
            className="font-semibold text-black underline underline-offset-2 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
          >
            Limpiar todo
          </button>
        </p>
      ) : (
        <>
          <ul className="grid list-none gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pageRows.map((row) => (
              <li key={row.id}>
                <figure className={reviewStoryCardClassName}>
                  <div className="flex items-center justify-between gap-4">
                    <StarRatingIcons rating={row.rating} />
                    <CheckCircle2
                      className="h-5 w-5 shrink-0 text-primary"
                      aria-hidden
                    />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    {row.productName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Por {row.reviewerLabel} · {formatReviewDate(row.createdAt)}
                  </p>
                  {row.comment ? (
                    <blockquote className="mt-4 flex-1 border-l-2 border-primary/40 pl-4 text-sm italic leading-relaxed text-muted-foreground">
                      {row.comment}
                    </blockquote>
                  ) : (
                    <p className="mt-4 text-sm italic text-muted-foreground">
                      Sin comentario escrito.
                    </p>
                  )}
                </figure>
              </li>
            ))}
          </ul>
          <SimplePaginationBar
            page={safePage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setPage}
            idPrefix="product-reviews"
          />
        </>
      )}
    </>
  );
}

function SiteReviewsSection({
  rows,
  onOpenForm,
}: {
  rows: SiteReviewListItem[];
  onOpenForm: () => void;
}) {
  const [page, setPage] = useState(1);
  const [dateSort, setDateSort] = useState<ReviewDateSort>("newest");
  const [ratingFilter, setRatingFilter] = useState<ReviewRatingFilter>("all");
  const clearFilters = () => {
    setDateSort("newest");
    setRatingFilter("all");
  };

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
      return dateSort === "newest" ? safeB - safeA : safeA - safeB;
    });

  const totalItems = filteredAndSortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / REVIEWS_PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setPage(1);
  }, [rows.length]);

  useEffect(() => {
    setPage(1);
  }, [dateSort, ratingFilter]);

  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * REVIEWS_PAGE_SIZE;
  const pageRows = filteredAndSortedRows.slice(offset, offset + REVIEWS_PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-border/70 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground font-medium">
          Opiniones sobre la experiencia general en Global Computers USA.
        </p>
        <Button
          type="button"
          size="lg"
          className="h-12 min-h-12 shrink-0 rounded-xl px-7 text-base sm:w-auto"
          onClick={onOpenForm}
        >
          Escribir una reseña
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-10 text-center text-sm leading-relaxed text-muted-foreground">
          Aún no hay reseñas sobre la tienda. Sé la primera persona en contar
          cómo fue tu experiencia usando el botón «Deja una reseña».
        </p>
      ) : (
        <>
          <ReviewsFiltersToolbar
            idPrefix="site-reviews"
            dateSort={dateSort}
            ratingFilter={ratingFilter}
            onDateSortChange={setDateSort}
            onRatingFilterChange={setRatingFilter}
            onClearRatingFilter={() => setRatingFilter("all")}
          />
          {filteredAndSortedRows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-10 text-center text-sm leading-relaxed text-muted-foreground">
              Ninguna reseña coincide con los filtros. Ajusta los criterios para
              ver más resultados o{" "}
              <button
                type="button"
                onClick={clearFilters}
                className="font-semibold text-black underline underline-offset-2 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
              >
                Limpiar todo
              </button>
            </p>
          ) : (
            <>
              <ul className="grid list-none gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {pageRows.map((row) => (
                  <li key={row.id}>
                    <figure className={reviewStoryCardClassName}>
                      <div className="flex items-center justify-between gap-4">
                        <StarRatingIcons rating={row.rating} />
                        <CheckCircle2
                          className="h-5 w-5 shrink-0 text-primary"
                          aria-hidden
                        />
                      </div>
                      <blockquote className="mt-4 flex-1 border-l-2 border-primary/40 pl-4 text-sm italic leading-relaxed text-muted-foreground">
                        {row.comment}
                      </blockquote>
                      <figcaption className="mt-5 text-sm font-bold text-foreground">
                        {row.name}
                      </figcaption>
                      <p className="mt-1 text-xs font-normal text-muted-foreground">
                        {formatReviewDate(row.createdAt)}
                      </p>
                    </figure>
                  </li>
                ))}
              </ul>
              <SimplePaginationBar
                page={safePage}
                totalPages={totalPages}
                totalItems={totalItems}
                onPageChange={setPage}
                idPrefix="site-reviews"
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
