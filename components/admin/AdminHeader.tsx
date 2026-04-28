"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Bell,
  ChevronDown,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { AppLogo } from "@/components/brand/AppLogo";
import { LanguageSelector } from "@/components/i18n/LanguageSelector";
import { useI18n } from "@/components/i18n/I18nProvider";
import { useDropdownPresence } from "@/components/marketing/useDropdownPresence";
import { SITE_BRAND_NAME } from "@/lib/site";
import { cn } from "@/utils/cn";

export type AdminHeaderUser = {
  fullName: string;
  email: string;
  role: string;
};

type Props = {
  user: AdminHeaderUser;
  /** Abre el drawer del menú (solo en vista móvil) */
  onOpenMobileMenu?: () => void;
  /**
   * `admin`: hamburguesa + marca solo en móvil (el sidebar lleva la marca en escritorio).
   * `standalone`: marca siempre visible; sin botón de menú lateral.
   */
  variant?: "admin" | "standalone";
  /** Destino del logo y nombre (p. ej. `/admin/home`, `/`) */
  brandHref?: string;
  /** Oculta el botón de campana (p. ej. cuenta `/profile`). */
  hideBell?: boolean;
};

export function AdminHeader({
  user,
  onOpenMobileMenu,
  variant = "admin",
  brandHref: brandHrefProp,
  hideBell = false,
}: Props) {
  const brandHref =
    brandHrefProp ?? (variant === "standalone" ? "/" : "/admin/home");
  const [open, setOpen] = useState(false);
  const userMenuPresence = useDropdownPresence(open);
  const ref = useRef<HTMLDivElement>(null);

  const userMenuMotionClass = cn(
    "transition duration-200 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none",
    userMenuPresence.entered
      ? "translate-y-0 opacity-100"
      : "pointer-events-none -translate-y-1 opacity-0",
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { t } = useI18n();

  const displayName =
    user.fullName?.trim() ||
    user.email?.split("@")[0] ||
    t("admin.header.defaultUserName");

  const userInitial = useMemo(() => {
    const base = displayName.trim() || user.email?.split("@")[0] || "";
    const ch = base.charAt(0);
    return ch ? ch.toUpperCase() : "?";
  }, [displayName, user.email]);
  const avatarClass =
    "flex shrink-0 items-center justify-center rounded-full border border-primary/35 bg-primary/10 text-sm font-semibold leading-none text-primary";

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border/80 bg-white px-2.5 lg:px-6">
      {variant === "admin" && onOpenMobileMenu && (
        <button
          type="button"
          className="-ml-1 rounded-lg pl-1 text-muted-foreground transition hover:bg-muted hover:text-foreground md:hidden"
          onClick={onOpenMobileMenu}
          aria-label={t("admin.header.openNavigationMenu")}
        >
          <Menu className="h-6 w-6" aria-hidden />
        </button>
      )}

      <Link
        href={brandHref}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-1 py-0.5 transition-opacity hover:opacity-90",
          variant === "admin" && "md:hidden",
        )}
      >
        <AppLogo
          variant="mark"
          className={cn(
            "shrink-0",
            variant === "standalone" ? "h-9 w-9 md:h-12 md:w-12" : "h-9 w-9",
          )}
        />
        {variant === "standalone" ? (
          <span className="min-w-0">
            <span className="block truncate font-roboto text-sm font-light leading-tight tracking-tight text-[#040b1f] sm:text-[0.95rem]">
              {SITE_BRAND_NAME}
            </span>
            <span className="hidden truncate text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/90 sm:block">
              {t("header.brandTagline")}
            </span>
          </span>
        ) : (
          <span className="min-w-0 truncate font-roboto text-sm font-light leading-tight tracking-tight text-[#040b1f] sm:text-[0.95rem]">
            {SITE_BRAND_NAME}
          </span>
        )}
      </Link>

      <div
        className={cn(
          "flex min-w-0 items-center justify-end gap-2 sm:gap-3",
          variant === "admin" && "md:ml-auto md:flex-1",
        )}
      >
        {/* Campana (Bell): oculto en /profile con hideBell. Para volver a mostrarla ahí, quitar hideBell en app/profile/page.tsx.
            Markup conservado abajo (!hideBell): button + aria-label t(admin.header.notifications) + Bell h-5 w-5.
        */}
        {!hideBell ? (
          <button
            type="button"
            className="rounded-lg py-1.5 text-muted-foreground transition hover:text-foreground"
            aria-label={t("admin.header.notifications")}
          >
            <Bell className="h-5 w-5" />
          </button>
        ) : null}

        <LanguageSelector
          className={cn(
            "flex shrink-0 gap-1",
            variant === "admin" && "hidden md:flex",
          )}
          buttonClassName="bg-muted/80"
          aria-label={t("admin.header.languageToggle")}
        />

        <span
          className={cn(
            "h-7 w-px shrink-0 bg-border",
            variant === "admin" && "hidden md:block",
          )}
          aria-hidden
        />

        <div
          className="relative"
          ref={ref}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-3 rounded-lg py-1.5 px-1 transition hover:bg-transparent"
            aria-expanded={open}
            aria-haspopup="menu"
          >
            <span className={cn(avatarClass, "h-9 w-9")} aria-hidden>
              {userInitial}
            </span>
            <div className="hidden text-left sm:block">
              <p className="text-xs text-muted-foreground">
                {t("admin.header.welcome")}
              </p>
              <p className="max-w-[200px] truncate text-sm font-semibold leading-tight text-foreground">
                {displayName}
              </p>
            </div>
            <ChevronDown
              className={cn(
                "hidden h-4 w-4 text-muted-foreground sm:block",
                open && "rotate-180",
              )}
            />
          </button>

          {userMenuPresence.mounted && (
            <div className="absolute right-0 top-full z-50 pt-1">
              <div
                className={cn(
                  "min-w-[260px] overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-md",
                  userMenuMotionClass,
                )}
                role="menu"
              >
                <div className="border-b border-border px-3 py-2 sm:hidden">
                  <p className="text-xs text-muted-foreground">
                    {t("admin.header.welcome")}
                  </p>
                  <p className="truncate text-sm font-medium">{displayName}</p>
                </div>
                <Link
                  href="/"
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  <Home className="h-4 w-4" />
                  {t("admin.header.goToSite")}
                </Link>
                {variant === "standalone" && user.role === "ADMIN" ? (
                  <Link
                    href="/admin/home"
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {t("admin.header.adminPanel")}
                  </Link>
                ) : null}
                <form action="/auth/logout" method="post">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
                    role="menuitem"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("admin.header.logout")}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
