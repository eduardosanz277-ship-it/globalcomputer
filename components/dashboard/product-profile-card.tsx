"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/utils/cn";

export type ProductProfileCardProps = {
  name: string;
  sku: string;
  imageUrl?: string | null;
  /** Categoría / subcategoría en catálogo (opcional). */
  catalogLabel?: string;
  brandName: string;
  brandTypeName: string;
  price: number;
  stock: number;
  active: boolean;
  className?: string;
  actions?: React.ReactNode;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function stockBadgeClass(stock: number): string {
  /** Base compartida con `activeBadgeClass` (mismo alto visual). */
  const base =
    "inline-flex items-center justify-center gap-0.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium leading-none";
  if (stock <= 0) {
    return `${base} border-red-200/90 bg-red-100 text-red-800 dark:border-red-800/50 dark:bg-red-950/45 dark:text-red-200`;
  }
  if (stock <= 10) {
    return `${base} border-amber-200/90 bg-amber-100 text-amber-900 dark:border-amber-800/45 dark:bg-amber-950/40 dark:text-amber-200`;
  }
  return `${base} border-emerald-200/90 bg-emerald-100 text-emerald-700 dark:border-emerald-800/45 dark:bg-emerald-950/35 dark:text-emerald-200`;
}

function activeBadgeClass(active: boolean): string {
  const base =
    "inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-xs font-medium leading-none";
  return active
    ? `${base} border-emerald-200/90 bg-emerald-50 text-emerald-800`
    : `${base} border-slate-200/90 bg-slate-100 text-slate-700`;
}

export function ProductProfileCard({
  name,
  sku,
  imageUrl,
  catalogLabel,
  brandName,
  brandTypeName,
  price,
  stock,
  active,
  className,
  actions,
}: ProductProfileCardProps) {
  const title = name.trim() || "—";

  const catalogOk = Boolean(catalogLabel?.trim()) && catalogLabel !== "—";
  const brandOk = Boolean(brandName?.trim()) && brandName !== "—";
  const typeOk = Boolean(brandTypeName?.trim()) && brandTypeName !== "—";

  const categorySubcategoryLine = catalogOk && catalogLabel ? catalogLabel : null;
  const categoryParts = categorySubcategoryLine
    ? categorySubcategoryLine
        .split(/\s*›\s*/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const categoryName = categoryParts[0] ?? null;
  const subcategoryName = categoryParts[1] ?? null;
  const brandTypeLine = [
    brandOk ? brandName : null,
    typeOk ? brandTypeName : null,
  ]
    .filter(Boolean)
    .join(" · ");

  /** `md+`: una sola línea meta (catálogo · marca · tipo o marca · tipo). */
  const metaLineDesktop =
    catalogOk && catalogLabel
      ? [
          catalogLabel.trim(),
          brandOk ? brandName : null,
          typeOk ? brandTypeName : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : brandTypeLine;

  return (
    <div
      className={cn(
        "min-w-0 rounded-xl border border-border/80 bg-card p-5 text-card-foreground",
        "transition-shadow duration-200 hover:shadow-sm",
        className,
      )}
    >
      <div className="space-y-3.5">
        <div className="flex min-w-0 items-start gap-3">
          {imageUrl ? (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border/80 bg-muted">
              <Image
                src={imageUrl}
                alt={title}
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-muted text-muted-foreground">
              <ImageOff className="h-6 w-6" aria-hidden />
              <span className="sr-only">Sin imagen</span>
            </span>
          )}

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="space-y-0.5">
              <h3 className="truncate text-base font-semibold leading-snug text-foreground">
                {title}
              </h3>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">SKU:</span> {sku}
              </p>
              {metaLineDesktop ? (
                <p className="hidden truncate text-xs text-muted-foreground md:block">
                  {metaLineDesktop}
                </p>
              ) : null}
            </div>

            <div className="hidden flex-wrap items-center gap-2 md:flex">
              <p className="text-sm font-semibold leading-none text-foreground">
                {formatCurrency(price)}
              </p>
              <div className="flex items-center gap-1">
                <span className={stockBadgeClass(stock)} title="Stock">
                  <span className="tabular-nums">{stock}</span>
                  <span> en stock</span>
                </span>
                <span className={activeBadgeClass(active)}>
                  {active ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
          </div>

          {actions ? (
            <div className="shrink-0 self-start">{actions}</div>
          ) : null}
        </div>

        <div className="space-y-2.5 border-t border-border/40 pt-3 md:hidden">
          {categoryName || subcategoryName || brandOk || typeOk ? (
            <div className="space-y-0.5">
              {categoryName ? (
                <p className="truncate text-sm text-foreground">
                  {categoryName}
                </p>
              ) : null}
              {subcategoryName ? (
                <p className="truncate text-xs text-muted-foreground">
                  {subcategoryName}
                </p>
              ) : null}
              {brandOk ? (
                <p className="truncate text-sm text-foreground">
                  {brandName}
                </p>
              ) : null}
              {typeOk ? (
                <p className="truncate text-xs text-muted-foreground">
                  {brandTypeName}
                </p>
              ) : null}
            </div>
          ) : null}
          <p className="text-sm font-semibold leading-none text-foreground">
            {formatCurrency(price)}
          </p>
          <div className="flex items-center gap-1">
            <span className={stockBadgeClass(stock)} title="Stock">
              <span className="tabular-nums">{stock}</span>
              <span> en stock</span>
            </span>
            <span className={activeBadgeClass(active)}>
              {active ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
