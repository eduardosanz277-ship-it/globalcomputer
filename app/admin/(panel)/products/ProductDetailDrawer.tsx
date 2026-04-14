"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  ChevronDown,
  Clock3,
  ExternalLink,
  FileText,
  ImageOff,
  PencilLine,
  Trash2,
} from "lucide-react";
import type { Product } from "@/modules/admin/products/products.types";
import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/ui/slide-over";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { ProductDescriptionViewer } from "@/components/ProductDescriptionViewer";

type Props = {
  product: Product | null;
  onClose: () => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
};

function formatCurrencyUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function getFileNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const last = pathname.split("/").filter(Boolean).at(-1);
    return last || "manual.pdf";
  } catch {
    const fallback = url.split("/").filter(Boolean).at(-1);
    return fallback || "manual.pdf";
  }
}

function stockBadgeClass(stock: number): string {
  return stock <= 0
    ? "inline-flex items-center rounded-full bg-neutral-600 px-2.5 py-1 text-xs font-medium text-white"
    : "inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700";
}

function activeBadgeClass(active: boolean): string {
  return active
    ? "inline-flex items-center rounded-full border border-emerald-200/90 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
    : "inline-flex items-center rounded-full border border-slate-200/90 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700";
}

export function ProductDetailDrawer({
  product,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const open = Boolean(product);
  const characteristicGroups = useMemo(() => {
    if (!product) return [];
    const groups = new Map<string, typeof product.characteristicValues>();
    for (const item of product.characteristicValues) {
      const key = item.generalName?.trim() || "Sin categoría general";
      const list = groups.get(key) ?? [];
      list.push(item);
      groups.set(key, list);
    }
    return Array.from(groups.entries());
  }, [product]);

  if (!product) {
    return (
      <SlideOver
        open={open}
        onClose={onClose}
        title="Detalles del producto"
        description="Información general y comercial del producto."
        panelClassName="md:w-[min(90vw,42rem)] lg:w-[55%] lg:max-w-none"
        contentAriaLabel="Detalles del producto"
      >
        <p className="text-sm text-muted-foreground">
          No hay producto seleccionado.
        </p>
      </SlideOver>
    );
  }

  const catalogParts = product.catalogLabel
    .split(/\s*›\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  const categoryName = catalogParts[0] ?? "—";
  const subcategoryName = catalogParts[1] ?? "—";
  const hasCategory = categoryName !== "—";
  const hasSubcategory = subcategoryName !== "—";
  const hasBrandType =
    Boolean(product.brandTypeName?.trim()) && product.brandTypeName !== "—";

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Detalles del producto"
      description="Información general y comercial del producto."
      panelClassName="md:w-[min(90vw,42rem)] lg:w-[55%] lg:max-w-none"
      contentAriaLabel="Detalles del producto"
    >
      <div className="space-y-4 md:space-y-5">
        <header className="rounded-xl border border-border/70 bg-card p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3.5">
              {product.imageUrl ? (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-muted">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-border bg-muted text-muted-foreground">
                  <ImageOff className="h-9 w-9" aria-hidden />
                  <span className="sr-only">Sin imagen</span>
                </span>
              )}
              <div className="min-w-0 space-y-1">
                <h2 className="truncate text-xl font-semibold text-foreground md:text-2xl">
                  {product.name}
                </h2>
                <div className="space-y-1 text-xs text-muted-foreground sm:text-sm">
                  <p>
                    <span className="font-medium">SKU:</span> {product.sku}
                  </p>

                  {hasCategory ? (
                    <>
                      <p className="hidden sm:block">
                        {categoryName}
                        {hasSubcategory ? ` · ${subcategoryName}` : ""}
                      </p>
                      <div className="space-y-0.5 sm:hidden">
                        <p>{categoryName}</p>
                        {hasSubcategory ? (
                          <p className="text-[11px] text-muted-foreground/80">
                            {subcategoryName}
                          </p>
                        ) : null}
                      </div>
                    </>
                  ) : null}

                  <div>
                    <p className="hidden sm:block">
                      {product.brandName}
                      {hasBrandType ? ` · ${product.brandTypeName}` : ""}
                    </p>
                    <div className="space-y-0.5 sm:hidden">
                      <p>{product.brandName}</p>
                      {hasBrandType ? (
                        <p className="text-[11px] text-muted-foreground/80">
                          {product.brandTypeName}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 self-end sm:self-start">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-lg"
                onClick={() => onEdit?.(product)}
                aria-label="Editar producto"
              >
                <PencilLine className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => onDelete?.(product)}
                aria-label="Eliminar producto"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-xl border border-border/70 bg-card">
          <button
            type="button"
            onClick={() => setDescriptionOpen((prev) => !prev)}
            aria-expanded={descriptionOpen}
            aria-label={
              descriptionOpen ? "Contraer descripción" : "Expandir descripción"
            }
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-muted/20"
          >
            <span className="text-sm font-medium text-foreground">
              Descripción
            </span>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${descriptionOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>

          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${descriptionOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
          >
            <div className="overflow-hidden border-t border-border/70">
              {product.description?.trim() ? (
                <div className="px-4 text-sm">
                  <ProductDescriptionViewer descripcion={product.description} />
                </div>
              ) : (
                <div className="m-3 rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  Sin descripción
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border/70 bg-card p-4">
          <h3 className="text-sm font-medium text-foreground">
            Información comercial
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Precio</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {formatCurrencyUsd(product.price)}
              </p>
              <div className="mt-3">
                <p className="text-xs text-muted-foreground">Descuentos</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    Empresa {product.discountBusinessPct}%
                  </span>
                  <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    Cliente {product.discountClient}%
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Stock</p>
                  <div className="mt-2">
                    <span className={stockBadgeClass(product.stock)}>
                      {product.stock <= 0
                        ? "Sin stock"
                        : `${product.stock} en stock`}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Estado</p>
                  <div className="mt-2">
                    <span className={activeBadgeClass(product.active)}>
                      {product.active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border/70 bg-card p-4">
          <h3 className="text-sm font-medium text-foreground">
            Imágenes del producto
          </h3>
          {product.images.length > 0 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 [scrollbar-width:thin]">
              {product.images.map((image) => (
                <article
                  key={image.id}
                  className="group relative w-36 shrink-0 overflow-hidden rounded-lg border border-border/70 bg-muted sm:w-40"
                >
                  <div className="relative aspect-square">
                    <Image
                      src={image.url}
                      alt={`${product.name} - imagen`}
                      fill
                      sizes="(max-width: 640px) 50vw, 160px"
                      className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                    />
                  </div>
                  {image.isPrimary ? (
                    <span className="absolute left-2 top-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary ring-1 ring-primary/25">
                      Principal
                    </span>
                  ) : null}
                </article>
              ))}
            </div>
          ) : product.imageUrl ? (
            <div className="mt-3 flex gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 [scrollbar-width:thin]">
              <article className="relative w-36 shrink-0 overflow-hidden rounded-lg border border-border/70 bg-muted sm:w-40">
                <div className="relative aspect-square">
                  <Image
                    src={product.imageUrl}
                    alt={`${product.name} - imagen`}
                    fill
                    sizes="(max-width: 640px) 50vw, 160px"
                    className="object-cover"
                  />
                </div>
                <span className="absolute left-2 top-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary ring-1 ring-primary/25">
                  Principal
                </span>
              </article>
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              Sin imágenes registradas
            </div>
          )}

          <div className="mt-4 border-t border-border/60 pt-4">
            <h4 className="text-sm font-medium text-foreground">
              Archivos adjuntos
            </h4>
            {product.manualPdfUrl?.trim() ? (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {getFileNameFromUrl(product.manualPdfUrl)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Manual PDF
                    </p>
                  </div>
                </div>
                <a
                  href={product.manualPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="sr-only">Ver manual PDF</span>
                </a>
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                Sin archivo adjunto
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border/70 bg-card p-4">
          <h3 className="text-sm font-medium text-foreground">
            Características específicas
          </h3>
          {characteristicGroups.length > 0 ? (
            <div className="mt-3 space-y-3">
              {characteristicGroups.map(([generalName, rows]) => (
                <article
                  key={generalName}
                  className="overflow-hidden rounded-lg border border-border/70 bg-muted/20"
                >
                  <header className="border-b border-border/70 bg-muted/40 px-3 py-2">
                    <p className="text-xs font-medium tracking-wide text-foreground">
                      {generalName}
                    </p>
                  </header>
                  <div className="flex flex-wrap gap-2 p-3">
                    {rows.map((item) => (
                      <div
                        key={item.id}
                        className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3 py-1.5"
                      >
                        <p className="truncate text-sm font-medium text-foreground">
                          {item.specificName}
                        </p>
                        {item.value?.trim() ? (
                          <p className="truncate text-xs text-muted-foreground">
                            · {item.value}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              Sin características específicas
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border/70 bg-card p-4">
          <h3 className="text-sm font-medium text-foreground">Metadatos</h3>
          <div className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Clock3 className="h-4 w-4" aria-hidden />
            <span>
              Actualizado el {formatDateDdMmYyyyHhMm(product.updatedAt)}
            </span>
          </div>
        </section>
      </div>
    </SlideOver>
  );
}
