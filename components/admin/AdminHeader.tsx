"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bell,
  ChevronDown,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  User,
} from "lucide-react";
import Link from "next/link";
import { AppLogo } from "@/components/brand/AppLogo";
import { SITE_BRAND_NAME, SITE_BRAND_TAGLINE } from "@/lib/site";
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
};

export function AdminHeader({
  user,
  onOpenMobileMenu,
  variant = "admin",
  brandHref: brandHrefProp,
}: Props) {
  const brandHref =
    brandHrefProp ?? (variant === "standalone" ? "/" : "/admin/home");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName =
    user.fullName?.trim() || user.email?.split("@")[0] || "Usuario";
  const roleLabel =
    user.role === "ADMIN"
      ? "Administrador"
      : user.role === "BUSINESS"
        ? "Negocio"
        : user.role === "CLIENT"
          ? "Cliente"
          : user.role;

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border/80 bg-white px-2.5 lg:px-6">
      {variant === "admin" && onOpenMobileMenu && (
        <button
          type="button"
          className="-ml-1 rounded-lg pl-1 text-muted-foreground transition hover:bg-muted hover:text-foreground md:hidden"
          onClick={onOpenMobileMenu}
          aria-label="Abrir menú de navegación"
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
              {SITE_BRAND_TAGLINE}
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
        <button
          type="button"
          className="rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
        </button>

        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-3 rounded-lg py-1.5 px-1 transition hover:bg-muted/80"
            aria-expanded={open}
            aria-haspopup="menu"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-admin text-white">
              <User className="h-4 w-4" aria-hidden />
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs text-muted-foreground">Bienvenido,</p>
              <p className="max-w-[200px] truncate text-sm font-semibold leading-tight text-foreground">
                {displayName}
              </p>
              <p className="max-w-[200px] truncate text-xs text-muted-foreground">
                {roleLabel}
              </p>
            </div>
            <ChevronDown
              className={cn(
                "hidden h-4 w-4 text-muted-foreground sm:block",
                open && "rotate-180",
              )}
            />
          </button>

          {open && (
            <div
              className="absolute right-0 top-full z-50 mt-1 min-w-[260px] rounded-lg border border-border bg-popover py-1 shadow-md"
              role="menu"
            >
              <div className="border-b border-border px-3 py-2 sm:hidden">
                <p className="text-xs text-muted-foreground">Bienvenido,</p>
                <p className="truncate text-sm font-medium">{displayName}</p>
              </div>
              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <Home className="h-4 w-4" />
                Ir al sitio
              </Link>
              {variant === "standalone" && user.role === "ADMIN" ? (
                <Link
                  href="/admin/home"
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Panel de administración
                </Link>
              ) : null}
              <form action="/auth/logout" method="post">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
                  role="menuitem"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
