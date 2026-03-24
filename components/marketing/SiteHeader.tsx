"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Camera,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import type { SessionUser } from "@/modules/auth/auth.types";

const NAV = [
  { href: "#categorias", label: "Categorías" },
  { href: "#destacados", label: "Destacados" },
  { href: "#ayuda", label: "Ayuda" },
];

function roleLabel(role: SessionUser["role"]): string {
  if (role === "ADMIN") return "Administrador";
  if (role === "BUSINESS") return "Empresa";
  return "Cliente";
}

type Props = {
  user: SessionUser | null;
};

export function SiteHeader({ user }: Props) {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRefMobile = useRef<HTMLDivElement>(null);
  const accountRefDesktop = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const t = e.target as Node;
      const inMobile =
        accountRefMobile.current?.contains(t) ?? false;
      const inDesktop =
        accountRefDesktop.current?.contains(t) ?? false;
      if (!inMobile && !inDesktop) setAccountOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName =
    user?.fullName?.trim() ||
    user?.email?.split("@")[0] ||
    "";

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-lg font-semibold tracking-tight text-foreground"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Camera className="h-5 w-5" aria-hidden />
          </span>
          <span className="hidden sm:inline">Global Computer</span>
        </Link>

        <div className="hidden min-w-0 flex-1 md:block md:max-w-md lg:max-w-lg">
          <label className="relative block">
            <span className="sr-only">Buscar productos</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Buscar cámaras, kits, marcas…"
              className="h-10 w-full rounded-full border border-input bg-muted/40 py-2 pl-9 pr-4 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
              readOnly
              aria-readonly
            />
          </label>
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {user ? (
            <div className="relative shrink-0 md:hidden" ref={accountRefMobile}>
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "relative"
                )}
                aria-expanded={accountOpen}
                aria-label="Mi cuenta"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                  {(displayName || "U").slice(0, 1).toUpperCase()}
                </span>
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border border-border bg-popover py-1 shadow-md">
                  <div className="border-b border-border px-3 py-2">
                    <p className="truncate text-sm font-medium">{displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href="/cuenta"
                    className="block px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => setAccountOpen(false)}
                  >
                    Mi cuenta
                  </Link>
                  <form action="/auth/logout" method="post">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              aria-label="Cuenta"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "shrink-0 md:hidden"
              )}
            >
              <User className="h-5 w-5" />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="relative shrink-0"
            aria-label="Carrito (0 artículos)"
          >
            <ShoppingCart className="h-5 w-5" aria-hidden />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-0.5 text-[10px] font-medium text-primary-foreground">
              0
            </span>
          </Button>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <div className="relative" ref={accountRefDesktop}>
                <button
                  type="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "max-w-[220px] gap-2"
                  )}
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                    {(displayName || "U").slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm font-medium leading-tight">
                      {displayName}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {roleLabel(user.role)}
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground",
                      accountOpen && "rotate-180"
                    )}
                  />
                </button>
                {accountOpen && (
                  <div
                    className="absolute right-0 top-full z-50 mt-1 min-w-[220px] rounded-lg border border-border bg-popover py-1 shadow-md"
                    role="menu"
                  >
                    <div className="border-b border-border px-3 py-2">
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      href="/cuenta"
                      className="block px-3 py-2 text-sm hover:bg-muted"
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                    >
                      Mi cuenta
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
            ) : (
              <>
                <Link
                  href="/login"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  Iniciar sesión
                </Link>
                <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}>
                  Registrarse
                </Link>
              </>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "border-t border-border/60 bg-muted/30 md:border-0 md:bg-transparent",
          !open && "hidden md:block"
        )}
      >
        <nav
          className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 md:flex-row md:items-center md:gap-8 md:px-6 md:py-0 lg:px-8"
          aria-label="Principal"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground md:py-4"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={user ? "/cuenta" : "/login"}
            className="rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground md:ml-auto md:py-4"
            onClick={() => setOpen(false)}
          >
            Mi cuenta
          </Link>
        </nav>
      </div>
    </header>
  );
}
