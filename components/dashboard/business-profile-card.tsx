"use client";

import type { ReactNode } from "react";
import type { BusinessRegistrationStatus } from "@/modules/auth/auth.types";
import { cn } from "@/utils/cn";
import { formatRelativeLastAccess } from "@/utils/formatRelativeLastAccess";

export type BusinessProfileCardProps = {
  email: string;
  fullName?: string | null;
  businessRegistrationStatus: BusinessRegistrationStatus | null | undefined;
  /** ISO string o `null` / ausente si no hay dato */
  lastSignInAt?: string | null;
  phone?: string | null;
  employerIdentificationNumber?: string | null;
  className?: string;
  /** Esquina superior derecha de la tarjeta (p. ej. menú ⋮ en admin móvil). */
  actions?: ReactNode;
};

function businessInitial(
  fullName: string | null | undefined,
  email: string,
): string {
  const n = fullName?.trim();
  if (n) return n.slice(0, 1).toUpperCase();
  const em = email?.trim();
  if (em) return em.slice(0, 1).toUpperCase();
  return "?";
}

function approvalLabel(
  s: BusinessRegistrationStatus | null | undefined,
): string {
  const v = s ?? "pending";
  if (v === "pending") return "Pendiente";
  if (v === "rejected") return "Rechazada";
  return "Aprobada";
}

function approvalBadgeClass(
  s: BusinessRegistrationStatus | null | undefined,
): string {
  const v = s ?? "pending";
  if (v === "pending") {
    return "border border-amber-200/90 bg-amber-50 text-amber-900";
  }
  if (v === "rejected") {
    return "border border-red-200/90 bg-red-50 text-red-800";
  }
  return "border border-emerald-200/90 bg-emerald-50 text-emerald-900";
}

function businessAvatarClass(
  s: BusinessRegistrationStatus | null | undefined,
): string {
  const v = s ?? "pending";
  if (v === "approved") {
    return "bg-sky-50 text-sky-800 ring-1 ring-sky-200/70 dark:bg-sky-950/50 dark:text-sky-200 dark:ring-sky-800/60";
  }
  return "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700/60";
}

function businessLeftBarClass(
  s: BusinessRegistrationStatus | null | undefined,
): string {
  const v = s ?? "pending";
  // 2px barrita a la izquierda (suave) usando `box-shadow inset`.
  if (v === "pending") {
    return "shadow-[inset_2px_0_0_rgba(245,158,11,0.35)]";
  }
  if (v === "rejected") {
    return "shadow-[inset_2px_0_0_rgba(239,68,68,0.35)]";
  }
  // approved
  return "shadow-[inset_2px_0_0_rgba(16,185,129,0.35)]";
}

export function BusinessProfileCard({
  email,
  fullName,
  businessRegistrationStatus,
  lastSignInAt,
  phone,
  employerIdentificationNumber,
  className,
  actions,
}: BusinessProfileCardProps) {
  const name = fullName?.trim();
  const em = email.trim();
  const title = name || em;
  const showEmailLine = Boolean(name && em);

  // const relative = formatRelativeLastAccess(lastSignInAt ?? null);

  return (
    <div
      className={cn(
        "relative min-w-0 rounded-xl border border-border/80 bg-card p-5 text-card-foreground",
        "transition-shadow duration-200 hover:shadow-sm",
        businessLeftBarClass(businessRegistrationStatus),
        className,
      )}
    >
      {actions ? (
        <div className="absolute inset-x-0 top-0 z-10 flex justify-end p-3 sm:p-5">
          <div className="pointer-events-auto shrink-0">{actions}</div>
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex gap-4">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
              businessAvatarClass(businessRegistrationStatus),
            )}
            aria-hidden
          >
            {businessInitial(fullName, email)}
          </div>

          <div
            className={cn(
              "min-w-0 flex-1 space-y-3",
              actions && "pr-10 sm:pr-12",
            )}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-start sm:gap-4">
              <div className="min-w-0 space-y-1">
                <h3 className="truncate text-base font-semibold leading-snug tracking-tight text-foreground">
                  {title}
                </h3>
                {showEmailLine ? (
                  <p className="truncate text-sm text-muted-foreground">{em}</p>
                ) : null}
              </div>

              <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-start gap-2">
                <span
                  className={cn(
                    "inline-flex w-fit shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium",
                    approvalBadgeClass(businessRegistrationStatus),
                  )}
                >
                  {approvalLabel(businessRegistrationStatus)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Último acceso (oculto en Suscripciones; se deja el código comentado). */}
        {/*
        <div className="space-y-1 border-t border-border/60 pt-4">
          <p className="text-sm text-muted-foreground">Último acceso</p>
          <p className="text-base font-medium leading-snug text-foreground">
            {relative != null ? (
              relative
            ) : (
              <span className="font-normal text-muted-foreground/70">—</span>
            )}
          </p>
        </div>
        */}

        <div className="space-y-3 border-t border-border/60 pt-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Teléfono</p>
            <p className="text-sm leading-snug text-foreground">
              {phone?.trim() ? phone : "—"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">EIN</p>
            <p className="text-xs font-mono leading-snug text-foreground">
              {employerIdentificationNumber?.trim()
                ? employerIdentificationNumber
                : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

