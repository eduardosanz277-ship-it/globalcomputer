"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/utils/cn";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { formatRelativeLastAccess } from "@/utils/formatRelativeLastAccess";

export type ServiceProfileCardProps = {
  name: string;
  imageUrl?: string | null;
  description?: string | null;
  updatedAt: string;
  className?: string;
  /** Esquina superior derecha de la tarjeta (p. ej. menú en admin móvil). */
  actions?: ReactNode;
};

function serviceExcerpt(description: string | null | undefined): string | null {
  if (!description) return null;
  const plain = description
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > 0 ? plain : null;
}

export function ServiceProfileCard({
  name,
  imageUrl,
  description,
  updatedAt,
  className,
  actions,
}: ServiceProfileCardProps) {
  const title = name.trim() || "—";
  const relative = formatRelativeLastAccess(updatedAt);
  const absolute = formatDateDdMmYyyyHhMm(updatedAt);
  const desc = serviceExcerpt(description);
  const initial = name.trim().slice(0, 1).toUpperCase() || "?";

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

      <div className={cn("space-y-4", actions && "pr-10 sm:pr-12")}>
        <div className="flex items-start gap-4">
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
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border-dashed border-border bg-muted text-sm font-semibold text-muted-foreground"
              aria-hidden
            >
              {initial}
            </span>
          )}

          <div className="min-w-0 flex-1 space-y-2">
            <h3 className="truncate text-base font-semibold leading-snug tracking-tight text-foreground">
              {title}
            </h3>
            {desc ? (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {desc}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </div>
        </div>

        <div className="space-y-1 border-t border-border/60 pt-4">
          <p className="text-sm text-muted-foreground">Última actualización</p>
          <p
            className="text-sm text-foreground"
            title={absolute || undefined}
          >
            {relative != null ? relative : absolute}
          </p>
        </div>
      </div>
    </div>
  );
}

