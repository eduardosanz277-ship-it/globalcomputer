"use client";

import type { ReactNode } from "react";
import type { UserRole } from "@/modules/auth/auth.types";
import { cn } from "@/utils/cn";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";

export type UserProfileCardProps = {
  email: string;
  fullName?: string | null;
  role: UserRole;
  /** ISO string o `null` / ausente si no hay dato */
  lastSignInAt?: string | null;
  className?: string;
  /** Esquina superior derecha de la tarjeta (p. ej. menú ⋮ en admin); no compite con el nombre. */
  actions?: ReactNode;
};

function userInitial(fullName: string | null | undefined, email: string): string {
  const n = fullName?.trim();
  if (n) return n.slice(0, 1).toUpperCase();
  const em = email?.trim();
  if (em) return em.slice(0, 1).toUpperCase();
  return "?";
}

function roleLabel(role: UserRole): string {
  if (role === "BUSINESS") return "Empresa";
  if (role === "CLIENT") return "Cliente";
  if (role === "ADMIN") return "Administrador";
  return role;
}

function roleBadgeClass(role: UserRole): string {
  if (role === "BUSINESS") {
    return "border border-blue-200/90 bg-blue-50/95 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200";
  }
  if (role === "CLIENT") {
    return "border border-slate-200/90 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200";
  }
  return "border border-violet-200/90 bg-violet-50 text-violet-800 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-200";
}

function roleAvatarClass(role: UserRole): string {
  if (role === "BUSINESS") {
    // Misma paleta que `userAvatarClass` en la tabla de admin.
    return "bg-sky-50 text-sky-800 ring-1 ring-sky-200/70 dark:bg-sky-950/50 dark:text-sky-200 dark:ring-sky-800/60";
  }
  if (role === "CLIENT") {
    return "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700/60";
  }
  // ADMIN u otros roles: mismo estilo que "resto" en la tabla.
  return "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700/60";
}

/**
 * Card compacto estilo producto SaaS (referencia: Stripe, Linear, Vercel):
 * avatar con inicial, nombre o email, rol con badge suave y último acceso relativo.
 */
export function UserProfileCard({
  email,
  fullName,
  role,
  lastSignInAt,
  className,
  actions,
}: UserProfileCardProps) {
  const name = fullName?.trim();
  const em = email.trim();
  const title = name || em;
  const showEmailLine = Boolean(name && em);

  const exactDate = lastSignInAt ? formatDateDdMmYyyyHhMm(lastSignInAt) : null;

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
        <div className="flex gap-4">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
              roleAvatarClass(role),
              "text-sm font-semibold",
            )}
            aria-hidden
          >
            {userInitial(fullName, email)}
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
                    roleBadgeClass(role),
                  )}
                >
                  {roleLabel(role)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1 border-t border-border/60 pt-4">
          <p className="text-sm text-muted-foreground">Último acceso</p>
          <p className="text-sm leading-snug text-foreground">
            {exactDate != null ? (
              exactDate
            ) : (
              <span className="font-normal text-muted-foreground/70">—</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
