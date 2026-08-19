"use client";

import { StorefrontProductCard } from "@/components/store/StorefrontProductCard";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { StorefrontPriceTier } from "@/lib/storefront-pricing";
import type { StorefrontProduct } from "@/modules/catalog/storefront-product.shared";
import { cn } from "@/utils/cn";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Inter } from "next/font/google";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
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
  /** Metadatos de contexto (detalle de producto); opcionales si solo se usa el carrusel. */
  productId?: string;
  categoriaId?: string | null;
  subcategoryId?: string | null;
  marcaId?: string;
  tipoProductoId?: string | null;
  precio?: number;
  /** Resultado resuelto en el servidor (p. ej. {@link listSimilarStorefrontProducts} o destacados). */
  products: StorefrontProduct[];
  priceTier: StorefrontPriceTier;
  className?: string;
  /** Oculta el título interno cuando la página ya define el encabezado de sección (p. ej. home). */
  hideHeading?: boolean;
  /** Título del bloque; por defecto "Productos similares" (i18n). Permite reutilizar el carrusel para otros listados (ej. accesorios). */
  title?: string;
};

/**
 * Carrusel horizontal de productos similares (mismas tarjetas que el listado de productos).
 * Los metadatos de catálogo se documentan en props para trazabilidad; el listado mostrado es `products`.
 */
export function SimilarProducts({
  products,
  priceTier,
  className,
  hideHeading = false,
  title,
}: SimilarProductsProps) {
  const { t } = useI18n();
  /** Fila del título: mismo borde izquierdo que el contenido principal (referencia de alineación). */
  const alignRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLUListElement>(null);
  /** Solo el primer ciclo con métricas reales: evita snap/scroll inicial; no resetear en cada resize. */
  const needsInitialScrollResetRef = useRef(true);

  const similarProductKey = useMemo(
    () => products.map((p) => p.id).join(","),
    [products],
  );
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  /**
   * Métricas medidas en cliente:
   * - `offset`:   distancia en px desde el borde izquierdo del viewport hasta el borde
   *               izquierdo de la sección (= padding del layout).
   * - `viewportW`: `document.documentElement.clientWidth` (excluye la scrollbar del SO,
   *               a diferencia de `100vw` que la incluye y provocaría scroll horizontal).
   * Mientras es null (SSR / pre-paint) se usa el fallback con clases -mx-*.
   */
  const [carouselMetrics, setCarouselMetrics] = useState<{
    offset: number;
    viewportW: number;
  } | null>(null);

  /**
   * Posición del thumb del scrollbar personalizado.
   * - `ratio`:    fracción del contenido total que es visible (ancho del thumb / ancho del track).
   * - `progress`: posición de scroll normalizada 0–1.
   */
  const [thumbInfo, setThumbInfo] = useState({ ratio: 1, progress: 0 });

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
    setThumbInfo({
      ratio: scrollWidth > 0 ? clientWidth / scrollWidth : 1,
      progress: maxScroll > 0 ? scrollLeft / maxScroll : 0,
    });
  }, []);

  /**
   * Mide el offset desde el borde izquierdo del viewport hasta la columna de contenido
   * (borde izquierdo de la fila del título = mismo eje que el resto de la página).
   * Doble rAF + `document.fonts.ready` evita desajuste en la primera pintura si el layout
   * o las fuentes aún no han terminado de aplicarse.
   */
  useLayoutEffect(() => {
    const measure = () => {
      if (!alignRef.current) return;
      setCarouselMetrics({
        offset: Math.round(alignRef.current.getBoundingClientRect().left),
        viewportW: document.documentElement.clientWidth,
      });
    };

    measure();
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      measure();
      raf2 = requestAnimationFrame(measure);
    });

    void document.fonts?.ready?.then(measure);

    window.addEventListener("resize", measure, { passive: true });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.removeEventListener("resize", measure);
    };
  }, []);

  /** Al cambiar el listado de productos, volver al inicio del carrusel. */
  useLayoutEffect(() => {
    needsInitialScrollResetRef.current = true;
    const el = scrollRef.current;
    if (el) el.scrollLeft = 0;
  }, [similarProductKey]);

  /** Primera vez con métricas: anula desplazamiento inicial por snap (no en cada resize). */
  useLayoutEffect(() => {
    if (!carouselMetrics || !needsInitialScrollResetRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = 0;
    needsInitialScrollResetRef.current = false;
  }, [carouselMetrics]);

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

  const measured = carouselMetrics !== null;
  const { offset: contentOffset, viewportW } = carouselMetrics ?? {
    offset: 0,
    viewportW: 0,
  };

  /* Posición y tamaño del thumb en % del track. */
  const thumbWidthPct = thumbInfo.ratio * 100;
  const thumbOffsetPct = thumbInfo.progress * (100 - thumbWidthPct);

  return (
    <section
      className={cn("group/similar w-full", className)}
      aria-labelledby={hideHeading ? undefined : "similar-products-heading"}
      aria-label={
        hideHeading ? t("storefront.productDetail.featuredAria") : undefined
      }
    >
      {!hideHeading ? (
        <div
          ref={alignRef}
          className="mb-4 flex items-end justify-between gap-3"
        >
          <h2
            id="similar-products-heading"
            className={cn(
              inter.className,
              "text-lg font-semibold tracking-tight text-foreground sm:text-xl",
            )}
          >
            {title ?? t("storefront.productDetail.similarTitle")}
          </h2>
        </div>
      ) : (
        <div ref={alignRef} className="w-full" aria-hidden />
      )}

      {/*
       * Wrapper del carrusel.
       * Con métricas: se expande a `viewportW` (clientWidth, sin scrollbar del SO)
       * desplazando `marginLeft` el offset exacto de la sección → el <ul> abarca el
       * ancho visible completo y las tarjetas desbordan visualmente a ambos lados.
       * `overflow-hidden` evita scroll horizontal de página.
       * Sin métricas (SSR / pre-paint): fallback con -mx-* estáticos.
       */}
      <div
        className={cn(
          /* Solo recorte horizontal: evita scroll de página sin cortar la sombra inferior del card. */
          "relative overflow-x-clip overflow-y-visible",
          !measured && "-mx-4 sm:-mx-6 lg:-mx-8",
        )}
        style={
          measured
            ? { width: `${viewportW}px`, marginLeft: `-${contentOffset}px` }
            : undefined
        }
        onKeyDown={onCarouselKeyDown}
        role="region"
        aria-roledescription="carrusel"
        tabIndex={0}
      >
        {/* Botones solo en desktop (lg+); en móvil/tablet el swipe táctil es suficiente. */}
        {showNav ? (
          <>
            <button
              type="button"
              className={cn(
                similarCarouselNavBtnClass,
                "hidden lg:inline-flex",
                "pointer-events-none opacity-0 transition-opacity duration-200",
                "group-hover/similar:pointer-events-auto group-focus-within/similar:pointer-events-auto",
                canPrev
                  ? "group-hover/similar:opacity-100 group-focus-within/similar:opacity-100"
                  : "cursor-not-allowed group-hover/similar:opacity-35 group-focus-within/similar:opacity-35 hover:!bg-background/95",
              )}
              style={measured ? { left: `${contentOffset + 8}px` } : undefined}
              aria-label={t("storefront.productDetail.similarPrevAria")}
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
                "hidden lg:inline-flex",
                "pointer-events-none opacity-0 transition-opacity duration-200",
                "group-hover/similar:pointer-events-auto group-focus-within/similar:pointer-events-auto",
                canNext
                  ? "group-hover/similar:opacity-100 group-focus-within/similar:opacity-100"
                  : "cursor-not-allowed group-hover/similar:opacity-35 group-focus-within/similar:opacity-35 hover:!bg-background/95",
              )}
              style={measured ? { right: `${contentOffset + 8}px` } : undefined}
              aria-label={t("storefront.productDetail.similarNextAria")}
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

        {/*
         * Lista scrolleable: ocupa todo el ancho del wrapper (= viewportW).
         * El padding simétrico = contentOffset alinea el primer card con el margen
         * izquierdo del layout al inicio y el último con el margen derecho al final.
         * scrollPaddingLeft sincroniza el snap con ese padding.
         * El scrollbar nativo está oculto vía CSS (.similar-products-scroll);
         * se muestra un scrollbar personalizado debajo, dentro del flujo del layout.
         */}
        <ul
          ref={scrollRef}
          className={cn(
            /* pb-5: espacio dentro del scrollport para hover:shadow-md sin recorte por overflow-x-auto */
            "similar-products-scroll flex gap-4 overflow-x-auto overflow-y-visible scroll-smooth pt-1 pb-5 [-webkit-overflow-scrolling:touch]",
            !measured && [
              "before:block before:h-px before:w-4 before:shrink-0 before:content-['']",
              "after:block after:h-px after:w-4 after:shrink-0 after:content-['']",
              "sm:before:w-6 sm:after:w-6 lg:before:w-8 lg:after:w-8",
            ],
            "snap-x snap-mandatory",
          )}
          style={
            measured
              ? {
                  paddingLeft: `${contentOffset}px`,
                  paddingRight: `${contentOffset}px`,
                  scrollPaddingLeft: `${contentOffset}px`,
                }
              : undefined
          }
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

      {/*
       * Scrollbar personalizado: posicionado fuera del wrapper full-width,
       * por lo que hereda el ancho natural de la <section> (= área de contenido
       * del layout). El track y el thumb aparecen al hacer hover sobre la sección.
       */}
      {hasOverflow && (
        <div
          className={cn(
            /* pb-5 en el <ul> deja sitio a la sombra; este offset la acerca otra vez al carrusel (≈ mt-2). */
            "relative mt-[calc(0.5rem-1.25rem)] h-[3px] cursor-pointer rounded-full",
            "bg-transparent transition-colors duration-200",
            "group-hover/similar:bg-[var(--app-scrollbar-track)]",
            "group-focus-within/similar:bg-[var(--app-scrollbar-track)]",
          )}
          role="scrollbar"
          aria-orientation="horizontal"
          aria-valuenow={Math.round(thumbInfo.progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            if (scrollRef.current) {
              const { scrollWidth, clientWidth } = scrollRef.current;
              scrollRef.current.scrollLeft = pct * (scrollWidth - clientWidth);
            }
          }}
        >
          <div
            className={cn(
              "absolute inset-y-0 rounded-full",
              "bg-transparent transition-colors duration-200",
              "group-hover/similar:bg-[var(--app-scrollbar-thumb)]",
              "group-focus-within/similar:bg-[var(--app-scrollbar-thumb)]",
            )}
            style={{
              width: `${thumbWidthPct}%`,
              left: `${thumbOffsetPct}%`,
            }}
            onMouseEnter={(e) =>
              e.currentTarget.style.setProperty(
                "background-color",
                "var(--app-scrollbar-thumb-hover)",
              )
            }
            onMouseLeave={(e) =>
              e.currentTarget.style.removeProperty("background-color")
            }
          />
        </div>
      )}
    </section>
  );
}
