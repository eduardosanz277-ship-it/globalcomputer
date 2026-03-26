"use client";

import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { formatRelativeLastAccess } from "@/utils/formatRelativeLastAccess";

export type SpecificCharacteristicProfileCardProps = {
  name: string;
  generalName?: string | null;
  active: boolean;
  updatedAt: string;
  className?: string;
  actions?: ReactNode;
};

function statusBadgeClass(active: boolean): string {
  return active
    ? "border border-emerald-200/90 bg-emerald-50 text-emerald-800 dark:text-emerald-200"
    : "border border-slate-200/90 bg-slate-100 text-slate-700";
}

export function SpecificCharacteristicProfileCard({
  name,
  generalName,
  active,
  updatedAt,
  className,
  actions,
}: SpecificCharacteristicProfileCardProps) {
  const title = name.trim() || "—";
  const secondary = generalName?.trim();
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

      <div className={cn("space-y-4", actions && "pr-10 sm:pr-12")}>
        <div className="space-y-2">
          <h3 className="truncate text-base font-semibold leading-snug tracking-tight text-foreground">
            {title}
          </h3>
          {secondary ? (
            <p className="truncate text-sm text-muted-foreground">
              {secondary}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-start gap-2">
          <span
            className={cn(
              "inline-flex w-fit shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
              statusBadgeClass(active),
            )}
          >
            {active ? "Activo" : "Inactivo"}
          </span>
        </div>

        <div className="space-y-1 border-t border-border/60 pt-4">
          <p className="text-sm text-muted-foreground">Última actualización</p>
          <p
            className="text-sm font-medium text-foreground"
            title={absolute || undefined}
          >
            {relative != null ? relative : absolute}
          </p>
        </div>
      </div>
    </div>
  );
}

