"use client";

import Image from "next/image";
import {
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
    ? "inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700"
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
  const open = Boolean(product);
  if (!product) {
    return (
      <SlideOver
        open={open}
        onClose={onClose}
        title="Detalles del producto"
        description="Información general y comercial del producto."
        contentAriaLabel="Detalles del producto"
      >
        <p className="text-sm text-muted-foreground">
          No hay producto seleccionado.
        </p>
      </SlideOver>
    );
  }

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Detalles del producto"
      description="Información general y comercial del producto."
      contentAriaLabel="Detalles del producto"
    >
      <div className="space-y-4 md:space-y-5">
        <header className="rounded-xl border border-border/70 bg-card p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
                <p className="text-xs text-muted-foreground sm:text-sm">
                  SKU: {product.sku} · {product.brandName} ·{" "}
                  {product.brandTypeName}
                </p>
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
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {product.images.map((image) => (
                <article
                  key={image.id}
                  className="group relative overflow-hidden rounded-lg border border-border/70 bg-muted"
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
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <article className="relative overflow-hidden rounded-lg border border-border/70 bg-muted">
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
        </section>

        <section className="rounded-xl border border-border/70 bg-card p-4">
          <h3 className="text-sm font-medium text-foreground">Descuentos</h3>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              Empresa {product.discountBusinessPct}%
            </span>
            <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              Cliente {product.discountClient}%
            </span>
          </div>
        </section>

        <section className="rounded-xl border border-border/70 bg-card p-4">
          <h3 className="text-sm font-medium text-foreground">
            Características específicas
          </h3>
          {product.characteristicValues.length > 0 ? (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {product.characteristicValues.map((item) => (
                <article
                  key={item.id}
                  className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5"
                >
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.specificName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.generalName}
                  </p>
                  {item.value?.trim() ? (
                    <p className="mt-1.5 text-xs leading-5 text-foreground/90">
                      {item.value}
                    </p>
                  ) : null}
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
          <h3 className="text-sm font-medium text-foreground">Descripción</h3>
          {product.description?.trim() ? (
            <p className="mt-3 text-sm leading-6 text-foreground">
              {product.description}
            </p>
          ) : (
            <div className="mt-3 rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              Sin descripción
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border/70 bg-card p-4">
          <h3 className="text-sm font-medium text-foreground">
            Archivos adjuntos
          </h3>
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
