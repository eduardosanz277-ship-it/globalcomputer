"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FileText, ImageOff, Minus, Plus, ZoomIn } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { gcCartAddProduct } from "@/lib/store-cart";
import {
  activeDiscountPercent,
  priceAfterDiscount,
  type StorefrontPriceTier,
} from "@/lib/storefront-pricing";
import { stockBadgeClass } from "@/lib/storefront-stock";
import type { StorefrontProductDetail } from "@/modules/catalog/storefront-product-detail.service";
import { cn } from "@/utils/cn";

function formatUsd(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

type Props = {
  product: StorefrontProductDetail;
  priceTier: StorefrontPriceTier;
};

export function StorefrontProductDetailView({ product, priceTier }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [cartQty, setCartQty] = useState(1);
  const images = product.images;
  const hasImages = images.length > 0;

  const pct = activeDiscountPercent(
    {
      discount_client: product.discount_client,
      discount_business_pct: product.discount_business_pct,
    },
    priceTier,
  );
  const sale = priceAfterDiscount(product.price, pct);
  const showCompare = pct > 0 && sale < product.price;
  const stockUi = stockBadgeClass(product.stock);
  const canBuy = product.stock > 0;
  const maxCartQty = Math.max(1, product.stock);

  const bumpCartQty = (delta: number) => {
    setCartQty((q) => Math.min(maxCartQty, Math.max(1, q + delta)));
  };

  useEffect(() => {
    setCartQty(1);
  }, [product.id]);

  useEffect(() => {
    setCartQty((q) => Math.min(maxCartQty, Math.max(1, q)));
  }, [maxCartQty]);

  const charGroups = useMemo(() => {
    const m = new Map<string, typeof product.characteristics>();
    for (const c of product.characteristics) {
      const list = m.get(c.generalName) ?? [];
      list.push(c);
      m.set(c.generalName, list);
    }
    return Array.from(m.entries());
  }, [product.characteristics]);

  const brandTypeHref =
    product.brand_type_id && product.brand_id
      ? `/brands/${product.brand_id}/${product.brand_type_id}`
      : null;

  return (
    <div className="pb-16 pt-2">
      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-10">
        <div className="space-y-4">
          <div
            className={cn(
              "grid gap-4",
              hasImages &&
                "md:grid-cols-[5rem_minmax(0,1fr)] md:items-stretch md:gap-3",
            )}
          >
            {/* Imagen principal: arriba en móvil; columna derecha desde md */}
            <div
              className={cn(
                "min-w-0 max-md:order-1",
                hasImages && "md:col-start-2 md:row-start-1",
              )}
            >
              {hasImages ? (
                <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
                  <button
                    type="button"
                    className="group relative w-full cursor-pointer overflow-hidden rounded-xl text-left ring-offset-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-haspopup="dialog"
                    aria-expanded={lightboxOpen}
                    aria-label="Ver imagen ampliada"
                    onClick={() => setLightboxOpen(true)}
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-xl">
                      <Image
                        src={images[activeIdx].url}
                        alt={product.name}
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
                      "[&>button]:right-3 [&>button]:top-3 [&>button]:rounded-full [&>button]:border [&>button]:border-border/50 [&>button]:bg-background/95 [&>button]:shadow-md",
                    )}
                  >
                    <DialogTitle className="sr-only">
                      {product.name} — vista ampliada
                    </DialogTitle>
                    <div className="relative h-[min(85vh,90vw)] w-full min-h-[12rem]">
                      <Image
                        src={images[activeIdx].url}
                        alt={product.name}
                        fill
                        className="object-contain"
                        sizes="90vw"
                        priority={lightboxOpen}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <div className="relative aspect-square w-full">
                  <div
                    className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl border border-border/70 bg-card/90 p-6 text-center text-muted-foreground shadow-sm"
                    role="img"
                    aria-label="Sin imagen del producto"
                  >
                    <ImageOff
                      className="h-16 w-16 shrink-0 opacity-50"
                      strokeWidth={1.25}
                      aria-hidden
                    />
                    <span className="text-sm font-medium">Sin imagen</span>
                  </div>
                </div>
              )}
            </div>

            {hasImages ? (
              <div
                className={cn(
                  "flex w-full min-w-0 gap-2 [scrollbar-width:thin]",
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
                        ? "border-primary ring-2 ring-primary/25"
                        : "border-transparent opacity-70 hover:opacity-100",
                    )}
                    aria-label={`Ver imagen ${i + 1}`}
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
        </div>

        <div className="lg:sticky lg:top-28 space-y-6">
          <div>
            <div className="flex flex-col gap-2">
              {pct > 0 ? (
                <span
                  className="inline-flex w-fit items-center rounded-full bg-gradient-to-br from-rose-600 to-red-600 px-2.5 py-1 text-xs font-bold tabular-nums text-white shadow-md ring-1 ring-white/20"
                  aria-label={`Descuento ${Math.round(pct)} por ciento`}
                >
                  −{Math.round(pct)}%
                </span>
              ) : null}
              <p className="flex flex-wrap items-center gap-x-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <Link
                  href={`/brands/${product.brand_id}`}
                  className="transition hover:text-primary"
                >
                  {product.brand_name}
                </Link>
                {product.brand_type_name && product.brand_type_name !== "—" ? (
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
                        {product.brand_type_name}
                      </Link>
                    ) : (
                      <span>{product.brand_type_name}</span>
                    )}
                  </>
                ) : null}
              </p>
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-3 font-mono text-sm text-muted-foreground">
              SKU: <span className="text-foreground">{product.sku}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur-sm">
            {showCompare ? (
              <div
                className={cn(
                  "flex w-full gap-2",
                  "max-md:flex-col max-md:items-stretch",
                  "md:flex-row md:flex-wrap md:items-center md:gap-x-3",
                )}
              >
                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-2xl font-bold tabular-nums leading-none text-primary">
                    {formatUsd(sale)}
                  </span>
                  <span className="text-lg tabular-nums text-muted-foreground line-through decoration-2 decoration-muted-foreground/70">
                    {formatUsd(product.price)}
                  </span>
                </div>
                <span
                  className={cn(
                    "inline-flex w-fit shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-bold tabular-nums shadow-md",
                    stockUi.className,
                  )}
                >
                  {stockUi.label}
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="text-2xl font-bold tabular-nums leading-none text-primary">
                  {formatUsd(sale)}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold tabular-nums shadow-md",
                    stockUi.className,
                  )}
                >
                  {stockUi.label}
                </span>
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Precio según tu perfil (
              {priceTier === "business" ? "empresa" : "cliente / invitado"}).
              Incluye descuento aplicable si corresponde.
            </p>

            <div
              className={cn(
                "mt-6 flex flex-col gap-3",
                "sm:flex-row sm:items-stretch sm:gap-3",
              )}
            >
              <span id="product-qty-label" className="sr-only">
                Cantidad
              </span>
              <div
                className={cn(
                  "flex h-12 w-fit shrink-0 self-start items-stretch overflow-hidden rounded-xl border border-border/35 bg-white shadow-sm dark:border-border/50 dark:bg-card sm:min-w-[7.25rem]",
                  !canBuy && "pointer-events-none opacity-40",
                )}
                role="group"
                aria-labelledby="product-qty-label"
              >
                <button
                  type="button"
                  className="flex w-11 items-center justify-center text-muted-foreground transition hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset disabled:opacity-30"
                  aria-label="Reducir cantidad"
                  disabled={!canBuy || cartQty <= 1}
                  onClick={() => bumpCartQty(-1)}
                >
                  <Minus className="h-4 w-4" strokeWidth={2.75} />
                </button>
                <span className="flex min-w-[2.75rem] select-none items-center justify-center border-x border-border/50 px-2 text-center text-sm font-semibold tabular-nums text-foreground">
                  {cartQty}
                </span>
                <button
                  type="button"
                  className="flex w-11 items-center justify-center text-muted-foreground transition hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset disabled:opacity-30"
                  aria-label="Aumentar cantidad"
                  disabled={!canBuy || cartQty >= maxCartQty}
                  onClick={() => bumpCartQty(1)}
                >
                  <Plus className="h-4 w-4" strokeWidth={2.75} />
                </button>
              </div>

              <Button
                type="button"
                size="lg"
                disabled={!canBuy}
                className="h-12 w-full rounded-xl text-base font-semibold shadow-sm sm:min-w-0 sm:flex-1"
                onClick={() => {
                  if (!canBuy) {
                    toast.info("Este producto no tiene stock disponible.");
                    return;
                  }
                  gcCartAddProduct(product.id, cartQty);
                  toast.success(
                    cartQty === 1
                      ? `${product.name} · añadido al carrito`
                      : `${cartQty} × ${product.name} · añadidos al carrito`,
                  );
                  setCartQty(1);
                }}
              >
                Añadir al carrito
              </Button>
            </div>
          </div>

          {product.description ? (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Descripción
              </h2>
              <div className="rounded-2xl border border-border/50 bg-muted/20 px-5 py-4 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {product.description}
              </div>
            </section>
          ) : null}

          {product.manual_pdf_url ? (
            <a
              href={product.manual_pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-dashed border-primary/35 bg-primary/[0.04] px-5 py-4 text-sm font-medium text-primary transition hover:bg-primary/[0.08]"
            >
              <FileText className="h-5 w-5 shrink-0" strokeWidth={1.75} />
              <span>Descargar o ver manual (PDF)</span>
            </a>
          ) : null}

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
        </div>
      </div>
    </div>
  );
}
