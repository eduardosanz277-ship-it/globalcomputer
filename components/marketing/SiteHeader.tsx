"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  LogOut,
  Search,
  ShoppingCart,
  User,
} from "lucide-react";
import { AppLogo } from "@/components/brand/AppLogo";
import { SITE_BRAND_NAME } from "@/lib/site";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import type { SessionUser } from "@/modules/auth/auth.types";
import type { NavigationData } from "@/modules/navigation/navigation.types";

const SITE_NAME = "Global Computers USA";

function roleLabel(role: SessionUser["role"]): string {
  if (role === "ADMIN") return "Administrador";
  if (role === "BUSINESS") return "Empresa";
  return "Cliente";
}

type Props = {
  user: SessionUser | null;
};

export function SiteHeader({ user }: Props) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [navData, setNavData] = useState<NavigationData | null>(null);
  const [navLoading, setNavLoading] = useState(true);
  /** Columna derecha en menús mega (evita overflow que recorta submenús CSS) */
  const [hoveredGeneralId, setHoveredGeneralId] = useState<string | null>(
    null,
  );
  const [hoveredBrandId, setHoveredBrandId] = useState<string | null>(null);
  const accountRefMobile = useRef<HTMLDivElement>(null);
  const accountRefDesktop = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const t = e.target as Node;
      const inMobile = accountRefMobile.current?.contains(t) ?? false;
      const inDesktop = accountRefDesktop.current?.contains(t) ?? false;
      if (!inMobile && !inDesktop) setAccountOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadNav() {
      try {
        const res = await fetch("/api/navigation", { cache: "no-store" });
        if (!res.ok) throw new Error("Navigation response failed");
        const data = (await res.json()) as NavigationData;
        if (!cancelled) setNavData(data);
      } catch (error) {
        console.error("No se pudo cargar la navegación", error);
      } finally {
        if (!cancelled) setNavLoading(false);
      }
    }

    loadNav();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName =
    user?.fullName?.trim() || user?.email?.split("@")[0] || "";

  const activeGeneral = useMemo(() => {
    if (!navData?.characteristicsGeneral?.length || !hoveredGeneralId) {
      return null;
    }
    return (
      navData.characteristicsGeneral.find((c) => c.id === hoveredGeneralId) ??
      null
    );
  }, [navData?.characteristicsGeneral, hoveredGeneralId]);

  const activeBrand = useMemo(() => {
    if (!navData?.brands?.length || !hoveredBrandId) return null;
    return navData.brands.find((b) => b.id === hoveredBrandId) ?? null;
  }, [navData?.brands, hoveredBrandId]);

  const generalPanelHasSubs = Boolean(activeGeneral?.specifics?.length);
  const brandPanelHasSubs = Boolean(activeBrand?.brandTypes?.length);

  const megaPanelClass =
    "overflow-hidden rounded-xl border border-white/25 bg-primary text-left text-white shadow-2xl ring-1 ring-black/40";

  const navMegaRowClass =
    "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-white/95 transition";

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/90 shadow-sm shadow-primary/[0.03] backdrop-blur-xl">
      <div className="mx-auto grid min-h-[4rem] max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 px-4 py-2 sm:min-h-[4.75rem] sm:gap-x-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 justify-self-start">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-1 py-0.5 text-foreground transition-opacity hover:opacity-90 sm:gap-2"
          >
            <AppLogo
              priority
              className="h-[3.25rem] max-h-[3.75rem] shrink-0 sm:h-[4.5rem] sm:max-h-[4.75rem]"
            />
            <span className="min-w-0 truncate font-roboto text-base font-light leading-tight tracking-tight text-[#040b1f] sm:text-lg lg:text-xl">
              {SITE_BRAND_NAME}
            </span>
          </Link>
        </div>

        <div className="w-full min-w-0 px-1 sm:px-2 lg:px-3 xl:px-4">
          <label className="relative block w-full">
            <span className="sr-only">Buscar productos</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground sm:left-3.5"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Buscar cámaras, kits, marcas…"
              className="h-11 w-full rounded-3xl border border-border/80 bg-muted/50 py-2 pl-12 pr-4 text-sm outline-none ring-offset-background transition placeholder:text-brand-gray-light focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/25 sm:h-12 sm:pl-14 sm:pr-5"
              readOnly
              aria-readonly
            />
          </label>
        </div>

        <div className="flex min-w-0 justify-self-end gap-0.5 sm:gap-2">
          {user ? (
            <div className="relative shrink-0 md:hidden" ref={accountRefMobile}>
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "relative",
                )}
                aria-expanded={accountOpen}
                aria-label="Mi cuenta"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary">
                  {(displayName || "U").slice(0, 1).toUpperCase()}
                </span>
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-full z-50 mt-1.5 min-w-[220px] overflow-hidden rounded-2xl border border-border/80 bg-popover py-1 shadow-soft-lg">
                  <div className="border-b border-border/60 px-3 py-2.5">
                    <p className="truncate text-sm font-medium">{displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href="/cuenta"
                    className="block px-3 py-2.5 text-sm transition hover:bg-muted/80"
                    onClick={() => setAccountOpen(false)}
                  >
                    Mi cuenta
                  </Link>
                  <form action="/auth/logout" method="post">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-destructive transition hover:bg-muted/80"
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
                "shrink-0 md:hidden",
              )}
            >
              <User className="h-5 w-5" />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="relative shrink-0 rounded-xl"
            aria-label="Carrito (0 artículos)"
          >
            <ShoppingCart className="h-5 w-5" aria-hidden />
            <span className="absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
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
                    "max-w-[220px] gap-2 rounded-xl",
                  )}
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary">
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
                      "h-4 w-4 shrink-0 text-muted-foreground transition",
                      accountOpen && "rotate-180",
                    )}
                  />
                </button>
                {accountOpen && (
                  <div
                    className="absolute right-0 top-full z-50 mt-1.5 min-w-[240px] overflow-hidden rounded-2xl border border-border/80 bg-popover py-1 shadow-soft-lg"
                    role="menu"
                  >
                    <div className="border-b border-border/60 px-3 py-2">
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      href="/cuenta"
                      className="block px-3 py-2.5 text-sm transition hover:bg-muted/80"
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                    >
                      Mi cuenta
                    </Link>
                    <form action="/auth/logout" method="post">
                      <button
                        type="submit"
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-destructive transition hover:bg-muted/80"
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
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "rounded-xl",
                  )}
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  className={cn(buttonVariants({ size: "sm" }), "rounded-xl shadow-sm")}
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-primary/40 bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <nav
          className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 overflow-visible px-4 py-1 sm:gap-3 sm:px-6 lg:px-8"
          aria-label="Principal"
        >
          <Link
            href="/"
            className="snap-start rounded-full px-3 py-1.5 text-xs font-roboto font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-white/15 sm:px-4 sm:text-[12px] lg:text-sm"
          >
            Home
          </Link>

          <div className="group/nav relative">
            <span className="flex cursor-default snap-start rounded-full px-3 py-1.5 text-xs font-roboto font-semibold uppercase tracking-[0.24em] text-white transition group-hover/nav:bg-white/15 sm:px-4 sm:text-[12px] lg:text-sm">
              Security System
            </span>
            {(navLoading ||
              (navData?.characteristicsGeneral?.length ?? 0) > 0) && (
              <div className="pointer-events-none invisible absolute left-0 top-full z-[60] pt-2 opacity-0 transition duration-150 group-hover/nav:pointer-events-auto group-hover/nav:visible group-hover/nav:opacity-100">
                <div
                  className={cn(
                    megaPanelClass,
                    "flex font-roboto",
                    generalPanelHasSubs
                      ? "w-[min(100vw-2rem,30rem)] max-w-[30rem]"
                      : "w-[min(100vw-2rem,16rem)] max-w-[16rem]",
                  )}
                  onMouseLeave={() => setHoveredGeneralId(null)}
                >
                  {navLoading ? (
                    <p className="p-4 text-xs uppercase tracking-[0.35em] text-white/50">
                      cargando…
                    </p>
                  ) : (
                    <>
                      <div
                        className={cn(
                          "max-h-72 shrink-0 overflow-y-auto py-2",
                          generalPanelHasSubs
                            ? "w-[46%] border-r border-white/10"
                            : "w-full",
                        )}
                      >
                        {navData!.characteristicsGeneral.map((general) => {
                          const rowActive = hoveredGeneralId === general.id;
                          const hasSubs = general.specifics.length > 0;
                          return (
                            <Link
                              key={general.id}
                              href={`/security-system/${general.id}`}
                              onMouseEnter={() =>
                                setHoveredGeneralId(general.id)
                              }
                              className={cn(
                                navMegaRowClass,
                                "justify-between",
                                rowActive ? "bg-white/12" : "hover:bg-white/10",
                              )}
                            >
                              <span className="truncate">{general.name}</span>
                              {hasSubs ? (
                                <ChevronRight
                                  className="h-4 w-4 shrink-0 text-white"
                                  aria-hidden
                                />
                              ) : null}
                            </Link>
                          );
                        })}
                      </div>
                      {generalPanelHasSubs && activeGeneral ? (
                        <div className="min-w-0 flex-1 py-2">
                          <ul className="max-h-72 overflow-y-auto py-1">
                            {activeGeneral.specifics.map((specific) => (
                              <li key={specific.id}>
                                <Link
                                  href={`/security-system/${activeGeneral.id}/${specific.id}`}
                                  className={cn(
                                    navMegaRowClass,
                                    "hover:bg-white/10",
                                  )}
                                >
                                  <span className="truncate">
                                    {specific.name}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="group/shop relative">
            <span className="flex cursor-default snap-start rounded-full px-3 py-1.5 text-xs font-roboto font-semibold uppercase tracking-[0.24em] text-white transition group-hover/shop:bg-white/15 sm:px-4 sm:text-[12px] lg:text-sm">
              Shop by brand
            </span>
            {(navLoading || (navData?.brands?.length ?? 0) > 0) && (
              <div className="pointer-events-none invisible absolute left-0 top-full z-[60] pt-2 opacity-0 transition duration-150 group-hover/shop:pointer-events-auto group-hover/shop:visible group-hover/shop:opacity-100">
                <div
                  className={cn(
                    megaPanelClass,
                    "flex font-roboto",
                    brandPanelHasSubs
                      ? "w-[min(100vw-2rem,30rem)] max-w-[30rem]"
                      : "w-[min(100vw-2rem,16rem)] max-w-[16rem]",
                  )}
                  onMouseLeave={() => setHoveredBrandId(null)}
                >
                  {navLoading ? (
                    <p className="p-4 text-xs uppercase tracking-[0.35em] text-white/50">
                      cargando…
                    </p>
                  ) : (
                    <>
                      <div
                        className={cn(
                          "max-h-72 shrink-0 overflow-y-auto py-2",
                          brandPanelHasSubs
                            ? "w-[46%] border-r border-white/10"
                            : "w-full",
                        )}
                      >
                        {navData!.brands.map((brand) => {
                          const rowActive = hoveredBrandId === brand.id;
                          const hasSubs = brand.brandTypes.length > 0;
                          return (
                            <Link
                              key={brand.id}
                              href={`/brands/${brand.id}`}
                              onMouseEnter={() => setHoveredBrandId(brand.id)}
                              className={cn(
                                navMegaRowClass,
                                "justify-between",
                                rowActive ? "bg-white/12" : "hover:bg-white/10",
                              )}
                            >
                              <span className="truncate">{brand.name}</span>
                              {hasSubs ? (
                                <ChevronRight
                                  className="h-4 w-4 shrink-0 text-white"
                                  aria-hidden
                                />
                              ) : null}
                            </Link>
                          );
                        })}
                      </div>
                      {brandPanelHasSubs && activeBrand ? (
                        <div className="min-w-0 flex-1 py-2">
                          <ul className="max-h-72 overflow-y-auto py-1">
                            {activeBrand.brandTypes.map((type) => (
                              <li key={type.id}>
                                <Link
                                  href={`/brands/${activeBrand.id}/${type.id}`}
                                  className={cn(
                                    navMegaRowClass,
                                    "hover:bg-white/10",
                                  )}
                                >
                                  <span className="truncate">{type.name}</span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="group/svc relative">
            <span className="flex cursor-default snap-start rounded-full px-3 py-1.5 text-xs font-roboto font-semibold uppercase tracking-[0.24em] text-white transition group-hover/svc:bg-white/15 sm:px-4 sm:text-[12px] lg:text-sm">
              Services
            </span>
            {(navLoading || (navData?.services?.length ?? 0) > 0) && (
              <div className="pointer-events-none invisible absolute left-0 top-full z-[60] pt-2 opacity-0 transition duration-150 group-hover/svc:pointer-events-auto group-hover/svc:visible group-hover/svc:opacity-100">
                <div
                  className={cn(
                    megaPanelClass,
                    "min-w-[18rem] max-w-[22rem] p-0 font-roboto",
                  )}
                >
                  {navLoading ? (
                    <p className="p-4 text-xs uppercase tracking-[0.35em] text-white/50">
                      cargando…
                    </p>
                  ) : (
                    <ul className="max-h-80 divide-y divide-white/10 overflow-y-auto py-1">
                      {navData!.services.map((service) => (
                        <li key={service.id}>
                          <Link
                            href={`/services/${service.id}`}
                            className="block px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.07]"
                          >
                            {service.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          <Link
            href="/contact"
            className="group snap-start rounded-full px-3 py-1.5 text-xs font-roboto font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-white/15 sm:px-4 sm:text-[12px] lg:text-sm"
          >
            Contact
          </Link>

          <Link
            href="/leave-review"
            className="group snap-start rounded-full px-3 py-1.5 text-xs font-roboto font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-white/15 sm:px-4 sm:text-[12px] lg:text-sm"
          >
            Leave a review
          </Link>
        </nav>
      </div>
    </header>
  );
}
