"use client";

import Link from "next/link";
import { useState } from "react";
import { Camera, Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";

const NAV = [
  { href: "#categorias", label: "Categorías" },
  { href: "#destacados", label: "Destacados" },
  { href: "#ayuda", label: "Ayuda" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

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
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Iniciar sesión
            </Link>
            <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}>
              Registrarse
            </Link>
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
            href="/dashboard"
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
