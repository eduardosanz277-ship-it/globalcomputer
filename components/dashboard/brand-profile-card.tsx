"use client";

import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { formatRelativeLastAccess } from "@/utils/formatRelativeLastAccess";

export type BrandProfileCardProps = {
  name: string;
  active: boolean;
  /** ISO string */
  updatedAt: string;
  className?: string;
  /** Esquina superior derecha (p. ej. menú en admin móvil). */
  actions?: ReactNode;
};

function statusBadgeClass(active: boolean): string {
  return active
    ? "border border-emerald-200/90 bg-emerald-50 text-emerald-800 dark:text-emerald-200"
    : "border border-slate-200/90 bg-slate-100 text-slate-700";
}

/**
 * Card compacto para listados admin (sin avatar): nombre, estado y última actualización.
 * Mismo patrón visual que `BusinessProfileCard` / `UserProfileCard` (acciones arriba-derecha).
 */
export function BrandProfileCard({
  name,
  active,
  updatedAt,
  className,
  actions,
}: BrandProfileCardProps) {
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

      <div className="space-y-4">
        <div
          className={cn(
            "min-w-0 space-y-3",
            actions && "pr-10 sm:pr-12",
          )}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-start sm:gap-4">
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="truncate text-base font-semibold leading-snug tracking-tight text-foreground">
                {title}
              </h3>
            </div>
            <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-start gap-2">
              <span
                className={cn(
                  "inline-flex w-fit shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
                  statusBadgeClass(active),
                )}
              >
                {active ? "Activa" : "Inactiva"}
              </span>
            </div>
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
