"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { formatRelativeLastAccess } from "@/utils/formatRelativeLastAccess";

export type ProductProfileCardProps = {
  name: string;
  sku: string;
  imageUrl?: string | null;
  brandName: string;
  brandTypeName: string;
  price: number;
  stock: number;
  updatedAt: string;
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
  return stock <= 0
    ? "inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700"
    : "inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700";
}

export function ProductProfileCard({
  name,
  sku,
  imageUrl,
  brandName,
  brandTypeName,
  price,
  stock,
  updatedAt,
  className,
  actions,
}: ProductProfileCardProps) {
  const title = name.trim() || "—";
  const relative = formatRelativeLastAccess(updatedAt);
  const absolute = formatDateDdMmYyyyHhMm(updatedAt);

  return (
    <div
      className={cn(
        "relative min-w-0 rounded-xl border border-border/80 bg-card p-5 text-card-foreground",
        "transition-shadow duration-200 hover:shadow-sm",
        className,
      )}
    >
      {actions ? (
        <div className="absolute inset-x-0 top-0 z-10 flex justify-end p-3 sm:p-5">
          <div className="pointer-events-auto shrink-0">{actions}</div>
        </div>
      ) : null}

      <div className={cn("space-y-3.5", actions && "pr-10 sm:pr-12")}>
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
              <p className="text-xs text-muted-foreground">SKU: {sku}</p>
              <p className="truncate text-xs text-muted-foreground">
                {brandName} · {brandTypeName}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold leading-none text-foreground">
                {formatCurrency(price)}
              </p>
              <span className={stockBadgeClass(stock)}>
                {stock <= 0 ? "Sin stock" : `Stock ${stock}`}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-1 border-t border-border/60 pt-3">
          <p className="text-sm text-muted-foreground">Última actualización</p>
          <p className="text-sm text-foreground" title={absolute || undefined}>
            {relative != null ? relative : absolute}
          </p>
        </div>
      </div>
    </div>
  );
}