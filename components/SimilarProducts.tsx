"use client";

import { StorefrontProductCard } from "@/components/store/StorefrontProductCard";
import type { StorefrontPriceTier } from "@/lib/storefront-pricing";
import type { StorefrontProduct } from "@/modules/catalog/storefront-product.shared";
import { cn } from "@/utils/cn";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Inter } from "next/font/google";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/**
 * Mismas clases base que los btns del visor ampliado (Dialog).
 * No usar `disabled` + `pointer-events-none`: el clic atravesaba al Link de la tarjeta.
 */
const similarCarouselNavBtnClass =
  "absolute top-1/2 z-[20] inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background/95 text-foreground shadow-md backdrop-blur-sm transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary pointer-events-auto";

export type SimilarProductsProps = {
  productId: string;
  categoriaId: string | null;
  subcategoryId: string | null;
  marcaId: string;
  tipoProductoId: string | null;
  precio: number;
  /** Resultado resuelto en el servidor con {@link listSimilarStorefrontProducts}. */
  products: StorefrontProduct[];
  priceTier: StorefrontPriceTier;
  className?: string;
};

/**
 * Carrusel horizontal de productos similares (mismas tarjetas que el listado de productos).
 * Los metadatos de catálogo se documentan en props para trazabilidad; el listado mostrado es `products`.
 */
export function SimilarProducts({
  products,
  priceTier,
  className,
}: SimilarProductsProps) {
  const scrollRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    /** Tolerancia por subpíxeles y snap al comparar con los extremos. */
    const edge = 6;
    setHasOverflow(maxScroll > 1);
    setCanPrev(scrollLeft > edge);
    setCanNext(scrollLeft < maxScroll - edge);
  }, []);

  useLayoutEffect(() => {
    updateArrows();
    const id = requestAnimationFrame(() => updateArrows());
    return () => cancelAnimationFrame(id);
  }, [products.length, updateArrows]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(updateArrows);
    });
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  }, [products.length, updateArrows]);

  const scrollStep = useCallback((dir: -1 | 1) => {
    const root = scrollRef.current;
    if (!root) return;
    const first = root.querySelector("li");
    if (!first) return;
    const gap = 16;
    const w = (first as HTMLElement).offsetWidth + gap;
    root.scrollBy({ left: dir * w, behavior: "smooth" });
  }, []);

  const onCarouselKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (canPrev) scrollStep(-1);
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (canNext) scrollStep(1);
    }
  };

  if (products.length === 0) return null;

  const showNav = products.length > 1 && hasOverflow;

  return (
    <section
      className={cn("group/similar w-full", className)}
      aria-labelledby="similar-products-heading"
    >
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2
          id="similar-products-heading"
          className={cn(
            inter.className,
            "text-lg font-semibold tracking-tight text-foreground sm:text-xl",
          )}
        >
          Productos similares
        </h2>
      </div>

      <div
        className="relative"
        onKeyDown={onCarouselKeyDown}
        role="region"
        aria-roledescription="carrusel"
        tabIndex={0}
      >
        {showNav ? (
          <>
            <button
              type="button"
              className={cn(
                similarCarouselNavBtnClass,
                "left-2 sm:left-4",
                "pointer-events-none opacity-0 transition-opacity duration-200",
                "group-hover/similar:pointer-events-auto group-focus-within/similar:pointer-events-auto",
                canPrev
                  ? "group-hover/similar:opacity-100 group-focus-within/similar:opacity-100"
                  : "cursor-not-allowed group-hover/similar:opacity-35 group-focus-within/similar:opacity-35 hover:!bg-background/95",
              )}
              aria-label="Productos anteriores"
              aria-disabled={!canPrev}
              tabIndex={canPrev ? 0 : -1}
              onPointerDownCapture={(e) => {
                if (!canPrev) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!canPrev) return;
                scrollStep(-1);
              }}
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={2} aria-hidden />
            </button>
            <button
              type="button"
              className={cn(
                similarCarouselNavBtnClass,
                "right-2 sm:right-4",
                "pointer-events-none opacity-0 transition-opacity duration-200",
                "group-hover/similar:pointer-events-auto group-focus-within/similar:pointer-events-auto",
                canNext
                  ? "group-hover/similar:opacity-100 group-focus-within/similar:opacity-100"
                  : "cursor-not-allowed group-hover/similar:opacity-35 group-focus-within/similar:opacity-35 hover:!bg-background/95",
              )}
              aria-label="Productos siguientes"
              aria-disabled={!canNext}
              tabIndex={canNext ? 0 : -1}
              onPointerDownCapture={(e) => {
                if (!canNext) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!canNext) return;
                scrollStep(1);
              }}
            >
              <ChevronRight className="h-6 w-6" strokeWidth={2} aria-hidden />
            </button>
          </>
        ) : null}

        <ul
          ref={scrollRef}
          className={cn(
            "similar-products-scroll flex gap-4 overflow-x-auto scroll-smooth pt-1 [-webkit-overflow-scrolling:touch]",
            /* Sin scroll-pl: evita que el snap desplace scrollLeft>0 al inicio (btn izq. mal habilitado). */
            "snap-x snap-mandatory",
          )}
          role="list"
        >
          {products.map((p) => (
            <StorefrontProductCard
              key={p.id}
              product={p}
              priceTier={priceTier}
              interClassName={inter.className}
              embedPlain
              className={cn(
                "w-[min(17.5rem,calc(100vw-2.5rem))] shrink-0 snap-start sm:w-[17.5rem]",
              )}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
