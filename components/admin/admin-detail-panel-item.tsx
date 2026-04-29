"use client";

import type { ReactNode } from "react";

/** Tarjeta de detalle alineada con `/admin/contacts` y otros paneles admin. */
export function AdminDetailPanelItem({
  label,
  value,
  icon,
  labelClassName,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  labelClassName?: string;
}) {
  return (
    <article className="rounded-xl border border-border/70 bg-card p-4">
      <p
        className={
          labelClassName ??
          "inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
        }
      >
        {icon ? <span>{icon}</span> : null}
        {label}
      </p>
      <div className="mt-2 text-sm text-foreground">{value}</div>
    </article>
  );
}
