"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, ChevronDown, LogOut, Menu, User } from "lucide-react";
import Link from "next/link";
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
};

export function AdminHeader({ user, onOpenMobileMenu }: Props) {
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
    user.fullName?.trim() ||
    user.email?.split("@")[0] ||
    "Usuario";
  const roleLabel =
    user.role === "ADMIN"
      ? "Administrador"
      : user.role === "BUSINESS"
        ? "Negocio"
        : user.role === "CLIENT"
          ? "Cliente"
          : user.role;

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border/80 bg-white px-4 lg:px-6">
      {onOpenMobileMenu && (
        <button
          type="button"
          className="-ml-1 rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground md:hidden"
          onClick={onOpenMobileMenu}
          aria-label="Abrir menú de navegación"
        >
          <Menu className="h-6 w-6" aria-hidden />
        </button>
      )}

      <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
      <button
        type="button"
        className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
      </button>

      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-3 rounded-lg py-1.5 pl-1 pr-2 transition hover:bg-muted/80"
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
              open && "rotate-180"
            )}
          />
        </button>

        {open && (
          <div
            className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border border-border bg-popover py-1 shadow-md"
            role="menu"
          >
            <div className="border-b border-border px-3 py-2 sm:hidden">
              <p className="text-xs text-muted-foreground">Bienvenido,</p>
              <p className="truncate text-sm font-medium">{displayName}</p>
            </div>
            <Link
              href="/"
              className="block px-3 py-2 text-sm hover:bg-muted"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Ir al sitio
            </Link>
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
