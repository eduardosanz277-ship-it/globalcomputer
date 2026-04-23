"use client";

import type { ReactNode } from "react";
import type { UserRole } from "@/modules/auth/auth.types";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/utils/cn";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";

export type UserProfileCardProps = {
  email: string;
  fullName?: string | null;
  role: UserRole;
  /** ISO string o `null` / ausente si no hay dato */
  lastSignInAt?: string | null;
  locale?: "es" | "en";
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

function roleLabel(role: UserRole, t: (key: string) => string): string {
  if (role === "BUSINESS") return t("admin.users.roles.business");
  if (role === "CLIENT") return t("admin.users.roles.client");
  if (role === "ADMIN") return t("admin.users.roles.admin");
  return role;
}

function roleBadgeClass(role: UserRole): string {
  if (role === "BUSINESS") {
    return "border border-primary/25 bg-primary/10 text-primary";
  }
  if (role === "CLIENT") {
    return "border border-border bg-muted text-muted-foreground";
  }
  return "border border-secondary/35 bg-secondary/10 text-secondary";
}

function roleAvatarClass(role: UserRole): string {
  if (role === "BUSINESS") {
    return "bg-primary/15 text-primary ring-1 ring-primary/25";
  }
  if (role === "CLIENT") {
    return "bg-muted text-muted-foreground ring-1 ring-border";
  }
  return "bg-secondary/15 text-secondary ring-1 ring-secondary/30";
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
  locale,
  className,
  actions,
}: UserProfileCardProps) {
  const { t, locale: i18nLocale } = useI18n();
  const effectiveLocale = locale ?? i18nLocale;
  const name = fullName?.trim();
  const em = email.trim();
  const title = name || em;
  const showEmailLine = Boolean(name && em);

  const exactDate = lastSignInAt
    ? formatDateDdMmYyyyHhMm(lastSignInAt, effectiveLocale)
    : null;

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
                  {roleLabel(role, t)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1 border-t border-border/60 pt-4">
          <p className="text-sm text-muted-foreground">
            {t("admin.users.table.lastSignIn")}
          </p>
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
