"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CircleUserRound,
  ChevronDown,
  ChevronRight,
  LogIn,
  LogOut,
  Menu,
  Package,
  UserRoundPlus,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import { AppLogo } from "@/components/brand/AppLogo";
import { SITE_BRAND_NAME, SITE_BRAND_TAGLINE } from "@/lib/site";
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
  const pathname = usePathname();
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState({
    security: false,
    brands: false,
    services: false,
  });
  /** Una sola actualización al hacer scroll evita dobles renders al cambiar barra + menú. */
  const [headerShelf, setHeaderShelf] = useState({ top: true, menu: true });
  const showTopHeader = headerShelf.top;
  const showMainMenu = headerShelf.menu;
  const [navData, setNavData] = useState<NavigationData | null>(null);
  const [navLoading, setNavLoading] = useState(true);
  /** Columna derecha en menús mega (evita overflow que recorta submenús CSS) */
  const [hoveredGeneralId, setHoveredGeneralId] = useState<string | null>(null);
  const [hoveredBrandId, setHoveredBrandId] = useState<string | null>(null);
  const accountRefMobile = useRef<HTMLDivElement>(null);
  const accountRefDesktop = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    let lastY = window.scrollY;
    /** Ignora micro-deltas (rebote, anchoring) que reseteaban el acumulado tras mucho scroll. */
    const MIN_SCROLL_DELTA = 2;
    let visibleTop = true;
    let visibleMenu = true;
    const TOP_SHOW_Y = 2;
    /** Píxeles acumulados hacia abajo para ocultar la barra (tras volver a mostrarla hace falta acumular de nuevo). */
    const MIN_DOWN_ACCUM_FOR_HIDE_TOP = 72;
    const MENU_HIDE_Y = 280;
    const MENU_SHOW_Y = 210;
    const MIN_ACCUM_DOWN_FOR_HIDE = 40;
    const MIN_ACCUM_UP_FOR_SHOW = 30;
    let downAccum = 0;
    let downAccumTop = 0;
    let upAccum = 0;
    let rafId = 0;

    const setIfChanged = (nextTop: boolean, nextMenu: boolean) => {
      const topChanged = nextTop !== visibleTop;
      const menuChanged = nextMenu !== visibleMenu;
      if (!topChanged && !menuChanged) return;

      if (topChanged) {
        if (nextTop && !visibleTop) {
          /* Evita desync: al mostrar el header el layout/scroll puede cambiar y el siguiente delta fallaba. */
          lastY = window.scrollY;
          downAccumTop = 0;
        } else if (!nextTop && visibleTop) {
          /* Al colapsar la barra, el layout/scroll anchoring puede mover scrollY sin input del usuario. */
          requestAnimationFrame(() => {
            lastY = window.scrollY;
          });
        }
        visibleTop = nextTop;
      }
      if (menuChanged) {
        visibleMenu = nextMenu;
      }
      setHeaderShelf({ top: visibleTop, menu: visibleMenu });
    };

    const update = () => {
      const y = Math.max(window.scrollY, 0);
      const delta = y - lastY;

      if (y <= TOP_SHOW_Y) {
        setIfChanged(true, true);
        downAccum = 0;
        downAccumTop = 0;
        upAccum = 0;
        lastY = y;
        return;
      }

      let nextTop = visibleTop;
      let nextMenu = visibleMenu;

      const scrollingDown = delta > MIN_SCROLL_DELTA;
      const scrollingUp = delta < -MIN_SCROLL_DELTA;

      if (scrollingDown) {
        downAccum += delta;
        upAccum = 0;
        if (visibleTop) {
          downAccumTop += delta;
          if (downAccumTop >= MIN_DOWN_ACCUM_FOR_HIDE_TOP) {
            nextTop = false;
            downAccumTop = 0;
          }
        }
        // Oculta el menú solo con desplazamiento acumulado suficiente hacia abajo.
        if (y > MENU_HIDE_Y && downAccum >= MIN_ACCUM_DOWN_FOR_HIDE) {
          nextMenu = false;
          downAccum = 0;
        }
      } else if (scrollingUp) {
        upAccum += -delta;
        downAccum = 0;
        downAccumTop = 0;
        nextTop = true;
        // Al subir, el menú reaparece con intención de scroll o al cruzar el umbral.
        if (!visibleMenu) {
          if (y <= MENU_SHOW_Y || upAccum >= MIN_ACCUM_UP_FOR_SHOW) {
            nextMenu = true;
            upAccum = 0;
          }
        } else {
          nextMenu = true;
        }
      } else {
        /* Delta pequeño: no cambia dirección ni resetea acumulados (evita falsos "subida" con mucho scroll). */
        lastY = y;
        return;
      }

      setIfChanged(nextTop, nextMenu);
      lastY = y;
    };

    const onScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        update();
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
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

  /** `grid-template-rows` 0fr→1fr anima sin el coste de `max-height`. `overflow-hidden` se aplica por bloque; con cuenta abierta va `overflow-visible` para no recortar el dropdown. */
  const shelfRevealClass =
    "grid transition-[grid-template-rows,opacity] duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none";

  const megaPanelClass =
    "overflow-hidden rounded-xl border border-white/10 bg-primary text-left text-white shadow-md";

  const navMegaRowClass =
    "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-white/95 transition";

  /** Barra principal y drawer: mayúsculas, 15px, peso 500, letter-spacing 1px */
  const navPrimaryLabelClass =
    "font-roboto text-[15px] font-medium uppercase tracking-[1px]";

  const handleScrollToTopOnHome = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setMobileNavOpen(false);
    if (pathname !== "/") return;
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleMobileDetailsToggle =
    (key: "security" | "brands" | "services") =>
    (e: React.SyntheticEvent<HTMLDetailsElement>) => {
      const el = e.currentTarget;
      if (!el) return;
      setMobileDetailsOpen((prev) => ({ ...prev, [key]: el.open }));
    };

  useEffect(() => {
    setMobileNavOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) {
      setMobileDetailsOpen({
        security: false,
        brands: false,
        services: false,
      });
    }
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const html = document.documentElement;
    const body = document.body;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlOverflow = html.style.overflow;
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    return () => {
      body.style.overflow = prevBodyOverflow;
      html.style.overflow = prevHtmlOverflow;
    };
  }, [mobileNavOpen]);

  /** Misma lógica de scroll que la fila superior en desktop; se mantiene visible si menú o cuenta están abiertos. */
  const showMobileHeaderVisible = showTopHeader || mobileNavOpen || accountOpen;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b border-border/40 bg-background/90 shadow-sm shadow-primary/[0.03] backdrop-blur-md",
          !showMobileHeaderVisible &&
            "max-lg:border-b-0 max-lg:bg-transparent max-lg:shadow-none max-lg:backdrop-blur-none",
        )}
      >
        <div
          className={cn(
            "lg:hidden",
            shelfRevealClass,
            accountOpen ? "overflow-visible" : "overflow-hidden",
            showMobileHeaderVisible
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0 pointer-events-none",
          )}
        >
          <div
            className={cn(
              "min-h-0",
              accountOpen ? "overflow-visible" : "overflow-hidden",
            )}
          >
            <div
              className={cn(
                "mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-2 gap-y-2 px-2.5 py-2 sm:min-h-[3.75rem] sm:grid-cols-[auto_auto_minmax(0,1fr)_auto_auto] sm:items-center sm:gap-x-2 sm:px-3 sm:pb-2",
              )}
            >
            <button
              type="button"
              onClick={() => setMobileNavOpen((v) => !v)}
              className="row-start-1 col-start-1 rounded-lg pl-1 text-foreground transition hover:bg-muted/80"
              aria-label={
                mobileNavOpen ? "Cerrar menú principal" : "Abrir menú principal"
              }
              aria-expanded={mobileNavOpen}
            >
              {mobileNavOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            <Link
              href="/"
              onClick={handleScrollToTopOnHome}
              className="row-start-1 col-start-2 flex min-w-0 items-center gap-1 rounded-md p-0.5 transition-opacity hover:opacity-90 sm:max-w-[14rem] sm:gap-1.5 sm:justify-self-start md:max-w-[18rem]"
              aria-label={SITE_BRAND_NAME}
            >
              <AppLogo
                variant="mark"
                className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
              />
              <span className="truncate font-roboto text-sm font-light leading-tight tracking-tight text-[#040b1f] sm:text-[0.95rem]">
                Global Computer USA
              </span>
            </Link>

            <label className="relative col-span-4 row-start-2 block min-w-0 sm:col-span-1 sm:col-start-3 sm:row-start-1">
              <span className="sr-only">Buscar productos</span>
              <Search
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                name="q"
                placeholder="Buscar cámaras, kits, marcas..."
                autoComplete="off"
                className="h-10 w-full rounded-2xl border border-border/80 bg-muted/50 py-2 pl-3 pr-11 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/80 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/25 sm:h-9 sm:py-1.5 sm:text-[13px]"
              />
            </label>

            <div
              ref={accountRefMobile}
              className="relative row-start-1 col-start-3 justify-self-end sm:col-start-4"
              onMouseEnter={user ? () => setAccountOpen(true) : undefined}
              onMouseLeave={user ? () => setAccountOpen(false) : undefined}
            >
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => setAccountOpen((v) => !v)}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon" }),
                      "relative rounded-xl hover:bg-transparent",
                    )}
                    aria-expanded={accountOpen}
                    aria-label="Mi cuenta"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary">
                      {(displayName || "U").slice(0, 1).toUpperCase()}
                    </span>
                  </button>
                  {accountOpen && (
                    <div className="absolute right-0 top-full z-[100] pt-1">
                      <div className="min-w-[240px] overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-md">
                        <div className="border-b border-border px-3 py-2">
                          <p className="truncate text-sm font-medium">
                            {displayName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                        <Link
                          href="/cuenta"
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                          onClick={() => setAccountOpen(false)}
                        >
                          <CircleUserRound
                            className="h-4 w-4 shrink-0"
                            strokeWidth={1.35}
                            aria-hidden
                          />
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
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "rounded-xl hover:bg-transparent",
                  )}
                  aria-label="Iniciar sesión"
                >
                  <CircleUserRound
                    className="h-7 w-7"
                    strokeWidth={1.35}
                    aria-hidden
                  />
                </Link>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="relative -ml-1 row-start-1 col-start-4 shrink-0 justify-self-end rounded-xl hover:bg-transparent sm:col-start-5"
              aria-label="Carrito (0 artículos)"
            >
              <span className="relative inline-flex">
                <ShoppingCart
                  className="h-6 w-6"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <span className="absolute -right-1.5 -top-1.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  0
                </span>
              </span>
            </Button>
          </div>
          </div>
        </div>

        <div
          className={cn(
            shelfRevealClass,
            accountOpen ? "overflow-visible" : "overflow-hidden",
            showTopHeader
              ? "relative z-[80] grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0 pointer-events-none",
          )}
        >
          <div
            className={cn(
              "min-h-0",
              accountOpen ? "overflow-visible" : "overflow-hidden",
            )}
          >
            <div className="mx-auto hidden min-h-[4rem] max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 px-4 py-2 sm:min-h-[4.75rem] sm:gap-x-3 sm:px-6 lg:grid lg:px-8">
            <div className="flex min-w-0 justify-self-start">
              <Link
                href="/"
                className="flex min-w-0 items-center gap-1 py-0.5 text-foreground transition-opacity hover:opacity-90 sm:gap-2"
                onClick={handleScrollToTopOnHome}
              >
                <AppLogo
                  priority
                  className="h-[3.25rem] max-h-[3.75rem] shrink-0 sm:h-[4.5rem] sm:max-h-[4.75rem]"
                />
                <span className="min-w-0">
                  <span className="block truncate font-roboto text-base font-light leading-tight tracking-tight text-[#040b1f] sm:text-lg lg:text-xl">
                    {SITE_BRAND_NAME}
                  </span>
                  <span className="hidden truncate text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/90 sm:block">
                    {SITE_BRAND_TAGLINE}
                  </span>
                </span>
              </Link>
            </div>

            <div className="w-full min-w-0 px-1 sm:px-2 lg:px-3 xl:px-4">
              <label className="relative block w-full">
                <span className="sr-only">Buscar productos</span>
                <Search
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground sm:right-3.5"
                  aria-hidden
                />
                <input
                  type="search"
                  name="q"
                  placeholder="Buscar cámaras IP, DVR, kits de seguridad, marcas..."
                  autoComplete="off"
                  className="h-11 w-full rounded-3xl border border-border/80 bg-muted/50 py-2 pl-4 pr-12 text-sm outline-none ring-offset-background transition placeholder:text-brand-gray-light focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/25 sm:h-12 sm:pl-5 sm:pr-14"
                />
              </label>
            </div>

            <div className="flex min-w-0 justify-self-end gap-0.5 sm:gap-2">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="shrink-0 gap-2 rounded-xl px-2.5 hover:bg-transparent hover:text-foreground md:order-2 md:px-3"
                aria-label="Carrito (0 artículos)"
              >
                <span className="relative inline-flex">
                  <ShoppingCart
                    className="h-6 w-6"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <span className="absolute -right-2 -top-2 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                    0
                  </span>
                </span>
                <span className="hidden text-sm font-medium md:inline">
                  Carrito
                </span>
              </Button>

              <div className="hidden items-center gap-2 md:order-1 md:flex">
                {user ? (
                  <div
                    className="relative"
                    ref={accountRefDesktop}
                    onMouseEnter={() => setAccountOpen(true)}
                    onMouseLeave={() => setAccountOpen(false)}
                  >
                    <button
                      type="button"
                      onClick={() => setAccountOpen((v) => !v)}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "max-w-[220px] gap-2 rounded-xl hover:bg-transparent hover:text-foreground",
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
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                    {accountOpen && (
                      <div className="absolute right-0 top-full z-[100] pt-1">
                        <div
                          className="min-w-[240px] overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-md"
                          role="menu"
                        >
                          <div className="border-b border-border px-3 py-2">
                            <p className="truncate text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                          <Link
                            href="/cuenta"
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                            role="menuitem"
                            onClick={() => setAccountOpen(false)}
                          >
                            <CircleUserRound
                              className="h-4 w-4"
                              strokeWidth={1.35}
                            />
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
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="relative"
                    ref={accountRefDesktop}
                    onMouseEnter={() => setAccountOpen(true)}
                    onMouseLeave={() => setAccountOpen(false)}
                  >
                    <button
                      type="button"
                      onClick={() => setAccountOpen((v) => !v)}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "gap-2 rounded-xl hover:bg-transparent hover:text-foreground",
                      )}
                      aria-expanded={accountOpen}
                      aria-haspopup="menu"
                    >
                      <CircleUserRound
                        className="h-7 w-7"
                        strokeWidth={1.35}
                        aria-hidden
                      />
                      <span>Cuenta</span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                    {accountOpen && (
                      <div className="absolute right-0 top-full z-[100] pt-0.5">
                        <div
                          className="min-w-[240px] overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-md"
                          role="menu"
                        >
                          <Link
                            href="/login"
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                            role="menuitem"
                            onClick={() => setAccountOpen(false)}
                          >
                            <LogIn className="h-4 w-4" strokeWidth={1.6} />
                            Iniciar sesión
                          </Link>
                          <Link
                            href="/register"
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                            role="menuitem"
                            onClick={() => setAccountOpen(false)}
                          >
                            <UserRoundPlus
                              className="h-4 w-4"
                              strokeWidth={1.6}
                            />
                            Crear cuenta
                          </Link>
                          <Link
                            href="/cuenta"
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                            role="menuitem"
                            onClick={() => setAccountOpen(false)}
                          >
                            <Package className="h-4 w-4" strokeWidth={1.6} />
                            Mis pedidos
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>

        <div
          className={cn(
            "hidden border-t border-primary/40 bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] lg:grid lg:overflow-hidden lg:transition-[grid-template-rows,opacity] lg:duration-[220ms] lg:ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:lg:transition-none",
            showMainMenu
              ? "lg:grid-rows-[1fr] lg:opacity-100"
              : "lg:grid-rows-[0fr] lg:opacity-0 lg:pointer-events-none",
          )}
        >
          <div className="min-h-0 overflow-hidden lg:min-h-0">
          <nav
            className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 overflow-visible px-4 py-1 sm:gap-3 sm:px-6 lg:px-8"
            aria-label="Principal"
          >
            <Link
              href="/"
              className={cn(
                "snap-start rounded-full px-3 py-1.5 text-white transition hover:bg-white/10 sm:px-4",
                navPrimaryLabelClass,
              )}
              onClick={handleScrollToTopOnHome}
            >
              Inicio
            </Link>

            <div className="group/nav relative">
              <span
                className={cn(
                  "flex cursor-default snap-start items-center gap-1 rounded-full px-3 py-1.5 text-white transition group-hover/nav:bg-white/10 sm:px-4",
                  navPrimaryLabelClass,
                )}
              >
                Sistemas de Seguridad
                <ChevronDown className="h-3.5 w-3.5 shrink-0" />
              </span>
              {(navLoading ||
                (navData?.characteristicsGeneral?.length ?? 0) > 0) && (
                <div className="pointer-events-none invisible absolute left-0 top-full z-[60] pt-2 opacity-0 transition duration-150 group-hover/nav:pointer-events-auto group-hover/nav:visible group-hover/nav:opacity-100">
                  <div
                    className={cn(
                      megaPanelClass,
                      "flex items-stretch font-roboto",
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
                            "shrink-0 overflow-y-auto py-2",
                            generalPanelHasSubs
                              ? "w-[46%] border-r border-white/10 max-h-[70vh]"
                              : "w-full max-h-[70vh]",
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
                                  "hover:bg-white/10",
                                  rowActive && "bg-white/10",
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
                            <ul className="py-1">
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
              <span
                className={cn(
                  "flex cursor-default snap-start items-center gap-1 rounded-full px-3 py-1.5 text-white transition group-hover/shop:bg-white/10 sm:px-4",
                  navPrimaryLabelClass,
                )}
              >
                Ver Marcas
                <ChevronDown className="h-3.5 w-3.5 shrink-0" />
              </span>
              {(navLoading || (navData?.brands?.length ?? 0) > 0) && (
                <div className="pointer-events-none invisible absolute left-0 top-full z-[60] pt-2 opacity-0 transition duration-150 group-hover/shop:pointer-events-auto group-hover/shop:visible group-hover/shop:opacity-100">
                  <div
                    className={cn(
                      megaPanelClass,
                      "flex items-stretch font-roboto",
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
                            "shrink-0 overflow-y-auto py-2",
                            brandPanelHasSubs
                              ? "w-[46%] border-r border-white/10 max-h-[70vh]"
                              : "w-full max-h-[70vh]",
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
                                  "hover:bg-white/10",
                                  rowActive && "bg-white/10",
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
                            <ul className="py-1">
                              {activeBrand.brandTypes.map((type) => (
                                <li key={type.id}>
                                  <Link
                                    href={`/brands/${activeBrand.id}/${type.id}`}
                                    className={cn(
                                      navMegaRowClass,
                                      "hover:bg-white/10",
                                    )}
                                  >
                                    <span className="truncate">
                                      {type.name}
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

            <div className="group/svc relative">
              <span
                className={cn(
                  "flex cursor-default snap-start items-center gap-1 rounded-full px-3 py-1.5 text-white transition group-hover/svc:bg-white/10 sm:px-4",
                  navPrimaryLabelClass,
                )}
              >
                Servicios
                <ChevronDown className="h-3.5 w-3.5 shrink-0" />
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
                        Cargando…
                      </p>
                    ) : (
                      <ul className="py-2">
                        {navData!.services.map((service) => (
                          <li key={service.id}>
                            <Link
                              href={`/services/${service.id}`}
                              className={cn(
                                navMegaRowClass,
                                "hover:bg-white/10",
                                navPrimaryLabelClass,
                              )}
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
              className={cn(
                "group snap-start rounded-full px-3 py-1.5 text-white transition hover:bg-white/10 sm:px-4",
                navPrimaryLabelClass,
              )}
            >
              Contacto
            </Link>

            <Link
              href="/leave-review"
              className={cn(
                "group snap-start rounded-full px-3 py-1.5 text-white transition hover:bg-white/10 sm:px-4",
                navPrimaryLabelClass,
              )}
            >
              Reseñas
            </Link>
          </nav>
          </div>
        </div>
      </header>

      {mounted &&
        createPortal(
          <div className="lg:hidden">
            <div
              className={cn(
                "fixed inset-0 z-[100] transition-opacity duration-200",
                /* Móvil: velo. Tablet+: sin velo; la página detrás se ve igual (el div sigue capturando clics fuera). */
                "max-sm:bg-background/90 max-sm:backdrop-blur-[1px] sm:bg-transparent",
                mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0",
              )}
              onClick={() => setMobileNavOpen(false)}
              aria-hidden
            />
            <aside
              className={cn(
                "fixed inset-y-0 left-0 z-[101] w-full border-r border-border/70 bg-[#e4e7ec] text-foreground shadow-2xl transition-transform duration-300 ease-out sm:w-[min(92vw,26rem)]",
                mobileNavOpen ? "translate-x-0" : "-translate-x-full",
              )}
              aria-label="Menú principal móvil"
            >
              <div className="flex items-center justify-between border-b border-border/70 bg-[#e4e7ec] px-4 py-3">
                <span className="font-roboto text-[15px] font-medium uppercase tracking-[1px]">
                  Menú
                </span>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-lg p-2 transition hover:bg-muted"
                  aria-label="Cerrar menú principal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav
                className="h-[calc(100dvh-57px)] overflow-y-auto overscroll-contain bg-[#e4e7ec] p-3"
                aria-label="Principal móvil"
              >
                <div className="grid gap-0.5">
                  <Link
                    href="/"
                    onClick={handleScrollToTopOnHome}
                    className={cn(
                      "rounded-lg px-3 py-2 transition hover:bg-muted",
                      navPrimaryLabelClass,
                    )}
                  >
                    Inicio
                  </Link>
                  <details
                    className="rounded-lg transition open:bg-muted/40"
                    open={mobileDetailsOpen.security}
                    onToggle={handleMobileDetailsToggle("security")}
                  >
                    <summary
                      className={cn(
                        "flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2 transition hover:bg-muted",
                        navPrimaryLabelClass,
                      )}
                    >
                      Sistema de Seguridad
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    </summary>
                    <div className="grid gap-0.5 px-2 pb-2">
                      {(navData?.characteristicsGeneral ?? []).map(
                        (general) => (
                          <Link
                            key={general.id}
                            href={`/security-system/${general.id}`}
                            onClick={() => setMobileNavOpen(false)}
                            className="rounded-md px-3 py-1.5 text-sm text-foreground/90 transition hover:bg-muted"
                          >
                            {general.name}
                          </Link>
                        ),
                      )}
                    </div>
                  </details>
                  <details
                    className="rounded-lg transition open:bg-muted/40"
                    open={mobileDetailsOpen.brands}
                    onToggle={handleMobileDetailsToggle("brands")}
                  >
                    <summary
                      className={cn(
                        "flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2 transition hover:bg-muted",
                        navPrimaryLabelClass,
                      )}
                    >
                      Ver Marcas
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    </summary>
                    <div className="grid gap-0.5 px-2 pb-2">
                      {(navData?.brands ?? []).map((brand) => (
                        <Link
                          key={brand.id}
                          href={`/brands/${brand.id}`}
                          onClick={() => setMobileNavOpen(false)}
                          className="rounded-md px-3 py-1.5 text-sm text-foreground/90 transition hover:bg-muted"
                        >
                          {brand.name}
                        </Link>
                      ))}
                    </div>
                  </details>
                  <details
                    className="rounded-lg transition open:bg-muted/40"
                    open={mobileDetailsOpen.services}
                    onToggle={handleMobileDetailsToggle("services")}
                  >
                    <summary
                      className={cn(
                        "flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2 transition hover:bg-muted",
                        navPrimaryLabelClass,
                      )}
                    >
                      Services
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    </summary>
                    <div className="grid gap-0.5 px-2 pb-2">
                      {(navData?.services ?? []).map((service) => (
                        <Link
                          key={service.id}
                          href={`/services/${service.id}`}
                          onClick={() => setMobileNavOpen(false)}
                          className="rounded-md px-3 py-1.5 text-sm text-foreground/90 transition hover:bg-muted"
                        >
                          {service.name}
                        </Link>
                      ))}
                    </div>
                  </details>
                  <Link
                    href="/contact"
                    onClick={() => setMobileNavOpen(false)}
                    className={cn(
                      "rounded-lg px-3 py-2 transition hover:bg-muted",
                      navPrimaryLabelClass,
                    )}
                  >
                    Contact
                  </Link>
                  <Link
                    href="/leave-review"
                    onClick={() => setMobileNavOpen(false)}
                    className={cn(
                      "rounded-lg px-3 py-2 transition hover:bg-muted",
                      navPrimaryLabelClass,
                    )}
                  >
                    Leave a review
                  </Link>
                  {user ? (
                    <>
                      <Link
                        href="/cuenta"
                        onClick={() => setMobileNavOpen(false)}
                        className={cn(
                          "mt-1 rounded-lg border-t border-border/70 px-3 py-2 transition hover:bg-muted",
                          navPrimaryLabelClass,
                        )}
                      >
                        Mi cuenta
                      </Link>
                      <Link
                        href="/cuenta"
                        onClick={() => setMobileNavOpen(false)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-muted",
                          navPrimaryLabelClass,
                        )}
                      >
                        <Package className="h-4 w-4" strokeWidth={2} />
                        Mis pedidos
                      </Link>
                      <form action="/auth/logout" method="post">
                        <button
                          type="submit"
                          onClick={() => setMobileNavOpen(false)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-destructive transition hover:bg-muted",
                            navPrimaryLabelClass,
                          )}
                        >
                          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                          Cerrar sesión
                        </button>
                      </form>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setMobileNavOpen(false)}
                        className={cn(
                          "mt-1 flex items-center gap-2 rounded-lg border-t border-border/70 px-3 py-2 transition hover:bg-muted",
                          navPrimaryLabelClass,
                        )}
                      >
                        <LogIn className="h-4 w-4" strokeWidth={2} />
                        Iniciar sesión
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setMobileNavOpen(false)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-muted",
                          navPrimaryLabelClass,
                        )}
                      >
                        <UserRoundPlus className="h-4 w-4" strokeWidth={2} />
                        Crear cuenta
                      </Link>
                      <Link
                        href="/cuenta"
                        onClick={() => setMobileNavOpen(false)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-muted",
                          navPrimaryLabelClass,
                        )}
                      >
                        <Package className="h-4 w-4" strokeWidth={2} />
                        Mis pedidos
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </aside>
          </div>,
          document.body,
        )}
    </>
  );
}
