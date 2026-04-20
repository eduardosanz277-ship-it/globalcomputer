"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  UserRound,
  ChevronDown,
  ChevronRight,
  Loader2,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
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
import { useDropdownPresence } from "@/components/marketing/useDropdownPresence";
import { StoreCartDrawer } from "@/components/store/StoreCartDrawer";
import { useGcCart } from "@/components/store/useGcCart";
import { GC_CART_OPEN_EVENT, gcCartTotalUnits } from "@/lib/store-cart";
import { resolveStorefrontPriceTier } from "@/lib/storefront-pricing";

const SITE_NAME = "Global Computers USA";

/** Estado de carga dentro de paneles mega menú (fondo primary). */
function NavMegaMenuLoading() {
  return (
    <div
      className="flex min-h-[5rem] w-full flex-col items-center justify-center gap-3 px-4 py-6"
      role="status"
      aria-live="polite"
    >
      <Loader2
        className="h-7 w-7 shrink-0 animate-spin text-white/80"
        aria-hidden
      />
      <span className="text-xs uppercase tracking-[0.35em] text-white/55">
        Cargando
      </span>
    </div>
  );
}

type Props = {
  user: SessionUser | null;
};

/** Paneles del menú móvil (deslizamiento horizontal). Subopciones van en `<details>` dentro del nivel 2. */
type MobileNavPanel =
  | { kind: "root" }
  | { kind: "security" }
  | { kind: "brands" }
  | { kind: "categories" }
  | { kind: "services" };

function mobileNavPanelKey(panel: MobileNavPanel): string {
  switch (panel.kind) {
    case "root":
      return "root";
    case "security":
      return "security";
    case "brands":
      return "brands";
    case "categories":
      return "categories";
    case "services":
      return "services";
  }
}

export function SiteHeader({ user }: Props) {
  const pathname = usePathname();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountMenuPresence = useDropdownPresence(accountOpen);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileNavStack, setMobileNavStack] = useState<MobileNavPanel[]>([
    { kind: "root" },
  ]);
  const [navData, setNavData] = useState<NavigationData | null>(null);
  const [navLoading, setNavLoading] = useState(true);
  /** Columna derecha en menús mega (evita overflow que recorta submenús CSS) */
  const [hoveredGeneralId, setHoveredGeneralId] = useState<string | null>(null);
  const [hoveredBrandId, setHoveredBrandId] = useState<string | null>(null);
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(
    null,
  );
  /** Tras navegar, corta el :hover del mega menú hasta el siguiente movimiento o timeout. */
  const [suppressDesktopNavHover, setSuppressDesktopNavHover] = useState(false);
  const accountRefMobile = useRef<HTMLDivElement>(null);
  const accountRefDesktop = useRef<HTMLDivElement>(null);
  /** Limpia listeners/timeout de `armDesktopNavStripSuppress` al volver a armar o al desmontar. */
  const suppressNavStripCleanupRef = useRef<(() => void) | null>(null);
  const [mounted, setMounted] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const cartItems = useGcCart();
  const cartCount = gcCartTotalUnits(cartItems);
  const cartBadgeText = cartCount > 99 ? "99+" : String(cartCount);
  const storefrontPriceTier = resolveStorefrontPriceTier(user?.role);

  const handleCartIconClick = () => {
    if (pathname === "/carrito") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      const cartHero = document.getElementById("cart-page-hero");
      if (cartHero) {
        cartHero.classList.add(
          "ring-2",
          "ring-primary/55",
          "bg-primary/[0.04]",
          "shadow-sm",
        );
        window.setTimeout(() => {
          cartHero.classList.remove(
            "ring-2",
            "ring-primary/55",
            "bg-primary/[0.04]",
            "shadow-sm",
          );
        }, 900);
      }
      return;
    }
    setCartOpen(true);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function openCartFromAdd() {
      setCartOpen(true);
    }
    window.addEventListener(GC_CART_OPEN_EVENT, openCartFromAdd);
    return () =>
      window.removeEventListener(GC_CART_OPEN_EVENT, openCartFromAdd);
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

  /** Inicial para avatar circular (solo header público / SiteHeader). */
  const userInitial = useMemo(() => {
    if (!user) return "";
    const base = displayName.trim() || user.email?.split("@")[0] || "";
    const ch = base.charAt(0);
    return ch ? ch.toUpperCase() : "?";
  }, [user, displayName]);

  const publicUserAvatarClass =
    "flex shrink-0 items-center justify-center rounded-full border border-primary/35 bg-primary/10 text-sm font-semibold leading-none text-primary";

  /** En tienda pública, el admin solo ve en el menú usuario: panel + cerrar sesión. */
  const isAdminPublicUser = user?.role === "ADMIN";

  const accountMenuMotionClass = cn(
    "transition duration-200 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none",
    accountMenuPresence.entered
      ? "translate-y-0 opacity-100"
      : "pointer-events-none -translate-y-1 opacity-0",
  );

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

  const activeCategory = useMemo(() => {
    if (!navData?.catalogCategories?.length || !hoveredCategoryId) {
      return null;
    }
    return (
      navData.catalogCategories.find((c) => c.id === hoveredCategoryId) ?? null
    );
  }, [navData?.catalogCategories, hoveredCategoryId]);

  const generalPanelHasSubs = Boolean(activeGeneral?.specifics?.length);
  const brandPanelHasSubs = Boolean(activeBrand?.brandTypes?.length);
  const categoryPanelHasSubs = Boolean(activeCategory?.subcategories?.length);

  /** Contenedor en grid para la barra superior (móvil / escritorio). */
  const shelfRevealClass = "grid";

  const megaPanelClass =
    "overflow-hidden rounded-lg border border-white/10 bg-primary text-left text-white shadow-md";

  /** Misma altura que `py-1` del `<nav>`: continúa la franja verde hasta el borde inferior; el panel queda pegado a esa línea sin perder el hover. */
  const navMegaMenuBridgeClass = "h-1 shrink-0 bg-primary";

  const navMegaRowClass =
    "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-white/95 transition";

  /** Barra principal y drawer: mayúsculas, 15px, peso 500, letter-spacing 1px */
  const navPrimaryLabelClass =
    "font-roboto text-[15px] font-medium uppercase tracking-[1px]";

  /** Generales / marcas (cabecera de fila o desplegable) en menú móvil. */
  const mobileNavCatalogHeadingClass = "text-sm font-bold text-foreground/90";

  /** Específicos y tipos por marca (subenlaces). */
  const mobileNavCatalogRowClass = "text-sm font-medium text-foreground/90";

  const handleScrollToTopOnHome = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setMobileNavOpen(false);
    if (pathname !== "/") return;
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pushMobileNavPanel = (panel: MobileNavPanel) => {
    setMobileNavStack((prev) => [...prev, panel]);
  };

  const popMobileNavPanel = () => {
    setMobileNavStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  /** Cierra estado hover del mega menú y bloquea el :hover de la franja hasta movimiento o timeout (evita reapertura al quedar el puntero sobre el trigger). */
  function armDesktopNavStripSuppress() {
    setHoveredBrandId(null);
    setHoveredGeneralId(null);
    setHoveredCategoryId(null);
    suppressNavStripCleanupRef.current?.();
    suppressNavStripCleanupRef.current = null;
    setSuppressDesktopNavHover(true);
    let timerId: number | null = null;
    const clearSuppress = () => {
      setSuppressDesktopNavHover(false);
      suppressNavStripCleanupRef.current = null;
    };
    const onPointerMove = () => {
      if (timerId != null) {
        clearTimeout(timerId);
        timerId = null;
      }
      window.removeEventListener("pointermove", onPointerMove);
      clearSuppress();
    };
    timerId = window.setTimeout(() => {
      timerId = null;
      window.removeEventListener("pointermove", onPointerMove);
      clearSuppress();
    }, 650);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    suppressNavStripCleanupRef.current = () => {
      window.removeEventListener("pointermove", onPointerMove);
      if (timerId != null) {
        clearTimeout(timerId);
        timerId = null;
      }
    };
  }

  useEffect(() => {
    return () => {
      suppressNavStripCleanupRef.current?.();
      suppressNavStripCleanupRef.current = null;
    };
  }, []);

  const prevPathnameForNavRef = useRef<string | null>(null);
  useLayoutEffect(() => {
    setMobileNavOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  /** Tras commit de la nueva ruta (App Router ya actualizó `pathname`): cerrar mega menú y suprimir hover en la franja. */
  useEffect(() => {
    const prev = prevPathnameForNavRef.current;
    if (prev !== null && prev !== pathname) {
      armDesktopNavStripSuppress();
    }
    prevPathnameForNavRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) {
      setMobileNavStack([{ kind: "root" }]);
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

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/90 shadow-sm shadow-primary/[0.03] backdrop-blur-md">
        <div
          className={cn(
            "lg:hidden",
            shelfRevealClass,
            accountOpen ? "overflow-visible" : "overflow-hidden",
            "grid-rows-[1fr] opacity-100",
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
                "mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-2 gap-y-2 px-2.5 py-2 sm:min-h-[3.75rem] sm:grid-cols-[auto_auto_minmax(0,1fr)_auto_auto] sm:items-center sm:gap-x-2.5 sm:px-3 sm:pb-2",
              )}
            >
              <button
                type="button"
                onClick={() => setMobileNavOpen((v) => !v)}
                className="row-start-1 col-start-1 rounded-lg pl-1 text-foreground transition hover:bg-muted/80"
                aria-label={
                  mobileNavOpen
                    ? "Cerrar menú principal"
                    : "Abrir menú principal"
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
                  Global Computers USA
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
                  className="h-10 w-full rounded-full border border-border/70 bg-white/80 py-2 pl-3 pr-11 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/80 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/25 sm:h-9 sm:py-1.5 sm:text-[13px]"
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
                      <span
                        className={cn(publicUserAvatarClass, "h-8 w-8 text-xs")}
                        aria-hidden
                      >
                        {userInitial}
                      </span>
                    </button>
                    {accountMenuPresence.mounted && (
                      <div className="absolute right-0 top-full z-[100] pt-1">
                        <div
                          className={cn(
                            "min-w-[252px] overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-md",
                            accountMenuMotionClass,
                          )}
                        >
                          <div className="flex gap-3 border-b border-border px-3 py-3">
                            <span
                              className={cn(
                                publicUserAvatarClass,
                                "h-10 w-10 text-base",
                              )}
                              aria-hidden
                            >
                              {userInitial}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">
                                {displayName}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          {isAdminPublicUser ? (
                            <>
                              <Link
                                href="/admin/home"
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                onClick={() => setAccountOpen(false)}
                              >
                                <LayoutDashboard
                                  className="h-4 w-4 shrink-0"
                                  strokeWidth={1.35}
                                  aria-hidden
                                />
                                Panel de administración
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
                            </>
                          ) : (
                            <>
                              <Link
                                href="/cuenta"
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                onClick={() => setAccountOpen(false)}
                              >
                                <UserRound
                                  className="h-4 w-4 shrink-0"
                                  strokeWidth={1.35}
                                  aria-hidden
                                />
                                Mi cuenta
                              </Link>
                              <Link
                                href="/cuenta?tab=orders"
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                onClick={() => setAccountOpen(false)}
                              >
                                <Package
                                  className="h-4 w-4 shrink-0"
                                  strokeWidth={1.35}
                                  aria-hidden
                                />
                                Pedidos
                              </Link>
                              <Link
                                href="/cuenta?tab=addresses"
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                onClick={() => setAccountOpen(false)}
                              >
                                <MapPin
                                  className="h-4 w-4 shrink-0"
                                  strokeWidth={1.35}
                                  aria-hidden
                                />
                                Direcciones
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
                            </>
                          )}
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
                    <UserRound
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
                className="relative -ml-1.5 row-start-1 col-start-4 shrink-0 justify-self-end rounded-xl hover:bg-transparent sm:col-start-5"
                aria-label={`Carrito (${cartCount} ${cartCount === 1 ? "artículo" : "artículos"})`}
                onClick={handleCartIconClick}
              >
                <span className="relative inline-flex">
                  <ShoppingCart
                    className="h-6 w-6"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <span className="absolute -right-1.5 -top-1.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                    {cartBadgeText}
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
            "relative z-[80] grid-rows-[1fr] opacity-100",
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
                    className="h-11 w-full rounded-full border border-border/70 bg-white/80 py-2 pl-4 pr-12 text-sm outline-none ring-offset-background transition placeholder:text-brand-gray-light focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/25 sm:h-12 sm:pl-5 sm:pr-14"
                  />
                </label>
              </div>

              <div className="flex min-w-0 justify-self-end gap-0.5 sm:gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  className="shrink-0 gap-2 rounded-xl px-2.5 hover:bg-transparent hover:text-foreground md:order-2 md:px-3"
                  aria-label={`Carrito (${cartCount} ${cartCount === 1 ? "artículo" : "artículos"})`}
                  onClick={handleCartIconClick}
                >
                  <span className="relative inline-flex">
                    <ShoppingCart
                      className="h-6 w-6"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                    <span className="absolute -right-2 -top-2 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                      {cartBadgeText}
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
                        <span
                          className={cn(publicUserAvatarClass, "h-8 w-8")}
                          aria-hidden
                        >
                          {userInitial}
                        </span>
                        <span className="min-w-0 flex-1 text-left">
                          <span className="block truncate text-sm font-medium leading-tight">
                            {displayName}
                          </span>
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                      {accountMenuPresence.mounted && (
                        <div className="absolute right-0 top-full z-[100] pt-1">
                          <div
                            className={cn(
                              "min-w-[252px] overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-md",
                              accountMenuMotionClass,
                            )}
                            role="menu"
                          >
                            <div className="flex gap-3 border-b border-border px-3 py-3">
                              <span
                                className={cn(
                                  publicUserAvatarClass,
                                  "h-10 w-10 text-base",
                                )}
                                aria-hidden
                              >
                                {userInitial}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {displayName}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                            {isAdminPublicUser ? (
                              <>
                                <Link
                                  href="/admin/home"
                                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                  role="menuitem"
                                  onClick={() => setAccountOpen(false)}
                                >
                                  <LayoutDashboard
                                    className="h-4 w-4"
                                    strokeWidth={1.35}
                                  />
                                  Panel de administración
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
                              </>
                            ) : (
                              <>
                                <Link
                                  href="/cuenta"
                                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                  role="menuitem"
                                  onClick={() => setAccountOpen(false)}
                                >
                                  <UserRound
                                    className="h-4 w-4"
                                    strokeWidth={1.35}
                                  />
                                  Mi cuenta
                                </Link>
                                <Link
                                  href="/cuenta?tab=orders"
                                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                  role="menuitem"
                                  onClick={() => setAccountOpen(false)}
                                >
                                  <Package
                                    className="h-4 w-4 shrink-0"
                                    strokeWidth={1.35}
                                    aria-hidden
                                  />
                                  Pedidos
                                </Link>
                                <Link
                                  href="/cuenta?tab=addresses"
                                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                  role="menuitem"
                                  onClick={() => setAccountOpen(false)}
                                >
                                  <MapPin
                                    className="h-4 w-4 shrink-0"
                                    strokeWidth={1.35}
                                    aria-hidden
                                  />
                                  Direcciones
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
                              </>
                            )}
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
                        <UserRound
                          className="h-7 w-7"
                          strokeWidth={1.35}
                          aria-hidden
                        />
                        <span>Cuenta</span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                      {accountMenuPresence.mounted && (
                        <div className="absolute right-0 top-full z-[100] pt-0.5">
                          <div
                            className={cn(
                              "min-w-[240px] overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-md",
                              accountMenuMotionClass,
                            )}
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
                            <div
                              className="my-1 border-t border-border"
                              aria-hidden
                            />
                            <Link
                              href="/cuenta?tab=orders"
                              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                              role="menuitem"
                              onClick={() => setAccountOpen(false)}
                            >
                              <Package className="h-4 w-4" strokeWidth={1.6} />
                              Pedidos
                            </Link>
                            <Link
                              href="/cuenta?tab=addresses"
                              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                              role="menuitem"
                              onClick={() => setAccountOpen(false)}
                            >
                              <MapPin
                                className="h-4 w-4 shrink-0"
                                strokeWidth={1.6}
                                aria-hidden
                              />
                              Direcciones
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
            "hidden border-t border-primary/40 bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] lg:grid lg:grid-rows-[1fr] lg:overflow-visible",
            /* Solo `pointer-events-none` en el padre no corta :hover en hijos; hay que anular hits en todo el subárbol (y ! para vencer group-hover:*:pointer-events-auto del mega). */
            suppressDesktopNavHover &&
              "pointer-events-none [&_*]:!pointer-events-none",
          )}
        >
          <div className="min-h-0 overflow-visible lg:min-h-0">
            <nav
              className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 overflow-visible px-4 py-1 sm:gap-3 sm:px-6 lg:px-8"
              aria-label="Principal"
            >
              <Link
                href="/"
                className={cn(
                  "snap-start rounded-xl px-3 py-1.5 text-white transition hover:bg-white/10 sm:px-4",
                  navPrimaryLabelClass,
                )}
                onClick={handleScrollToTopOnHome}
              >
                Inicio
              </Link>

              <div className="group/cat relative">
                <span
                  className={cn(
                    "flex cursor-default snap-start items-center gap-1 rounded-xl px-3 py-1.5 text-white transition group-hover/cat:bg-white/10 sm:px-4",
                    navPrimaryLabelClass,
                  )}
                >
                  Categorías
                  <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                </span>
                {(navLoading ||
                  (navData?.catalogCategories?.length ?? 0) > 0) && (
                  <div className="pointer-events-none invisible absolute left-0 top-full z-[60] flex flex-col pt-0 opacity-0 transition-none group-hover/cat:pointer-events-auto group-hover/cat:visible group-hover/cat:opacity-100">
                    <div className={navMegaMenuBridgeClass} aria-hidden />
                    <div
                      className={cn(
                        megaPanelClass,
                        "flex items-stretch font-roboto",
                        categoryPanelHasSubs
                          ? "w-[min(100vw-2rem,30rem)] max-w-[30rem]"
                          : "w-[min(100vw-2rem,16rem)] max-w-[16rem]",
                      )}
                      onMouseLeave={() => setHoveredCategoryId(null)}
                    >
                      {navLoading ? (
                        <NavMegaMenuLoading />
                      ) : (
                        <>
                          <div
                            className={cn(
                              "shrink-0 overflow-y-auto py-2",
                              categoryPanelHasSubs
                                ? "w-[46%] border-r border-white/10 max-h-[70vh]"
                                : "w-full max-h-[70vh]",
                            )}
                          >
                            {navData!.catalogCategories.map((cat) => {
                              const rowActive = hoveredCategoryId === cat.id;
                              const hasSubs = cat.subcategories.length > 0;
                              return (
                                <Link
                                  key={cat.id}
                                  href={`/catalogo/${cat.id}`}
                                  onMouseEnter={() =>
                                    setHoveredCategoryId(cat.id)
                                  }
                                  onClick={armDesktopNavStripSuppress}
                                  className={cn(
                                    navMegaRowClass,
                                    "justify-between",
                                    "hover:bg-white/10",
                                    rowActive && "bg-white/10",
                                  )}
                                >
                                  <span className="truncate">{cat.name}</span>
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
                          {categoryPanelHasSubs && activeCategory ? (
                            <div className="min-w-0 flex-1 py-2">
                              <ul className="py-1">
                                {activeCategory.subcategories.map((sub) => (
                                  <li key={sub.id}>
                                    <Link
                                      href={`/catalogo/${activeCategory.id}/${sub.id}`}
                                      onClick={armDesktopNavStripSuppress}
                                      className={cn(
                                        navMegaRowClass,
                                        "hover:bg-white/10",
                                      )}
                                    >
                                      <span className="truncate">
                                        {sub.name}
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

              <div className="group/nav relative">
                <span
                  className={cn(
                    "flex cursor-default snap-start items-center gap-1 rounded-xl px-3 py-1.5 text-white transition group-hover/nav:bg-white/10 sm:px-4",
                    navPrimaryLabelClass,
                  )}
                >
                  Sistemas de Seguridad
                  <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                </span>
                {(navLoading ||
                  (navData?.characteristicsGeneral?.length ?? 0) > 0) && (
                  <div className="pointer-events-none invisible absolute left-0 top-full z-[60] flex flex-col pt-0 opacity-0 transition-none group-hover/nav:pointer-events-auto group-hover/nav:visible group-hover/nav:opacity-100">
                    <div className={navMegaMenuBridgeClass} aria-hidden />
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
                        <NavMegaMenuLoading />
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
                                <div
                                  key={general.id}
                                  role="presentation"
                                  onMouseEnter={() =>
                                    setHoveredGeneralId(general.id)
                                  }
                                  className={cn(
                                    navMegaRowClass,
                                    "cursor-default justify-between select-none",
                                    "hover:bg-white/10",
                                    rowActive && "bg-white/10",
                                  )}
                                >
                                  <span className="truncate">
                                    Ver por {general.name}
                                  </span>
                                  {hasSubs ? (
                                    <ChevronRight
                                      className="h-4 w-4 shrink-0 text-white"
                                      aria-hidden
                                    />
                                  ) : null}
                                </div>
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
                    "flex cursor-default snap-start items-center gap-1 rounded-xl px-3 py-1.5 text-white transition group-hover/shop:bg-white/10 sm:px-4",
                    navPrimaryLabelClass,
                  )}
                >
                  Ver Marcas
                  <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                </span>
                {(navLoading || (navData?.brands?.length ?? 0) > 0) && (
                  <div className="pointer-events-none invisible absolute left-0 top-full z-[60] flex flex-col pt-0 opacity-0 transition-none group-hover/shop:pointer-events-auto group-hover/shop:visible group-hover/shop:opacity-100">
                    <div className={navMegaMenuBridgeClass} aria-hidden />
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
                        <NavMegaMenuLoading />
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
                                  onMouseEnter={() =>
                                    setHoveredBrandId(brand.id)
                                  }
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
                    "flex cursor-default snap-start items-center gap-1 rounded-xl px-3 py-1.5 text-white transition group-hover/svc:bg-white/10 sm:px-4",
                    navPrimaryLabelClass,
                  )}
                >
                  Servicios
                  <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                </span>
                {(navLoading || (navData?.services?.length ?? 0) > 0) && (
                  <div className="pointer-events-none invisible absolute left-0 top-full z-[60] flex flex-col pt-0 opacity-0 transition-none group-hover/svc:pointer-events-auto group-hover/svc:visible group-hover/svc:opacity-100">
                    <div className={navMegaMenuBridgeClass} aria-hidden />
                    <div
                      className={cn(
                        megaPanelClass,
                        "min-w-[18rem] max-w-[22rem] p-0 font-roboto",
                      )}
                    >
                      {navLoading ? (
                        <NavMegaMenuLoading />
                      ) : (
                        <ul className="py-1">
                          {navData!.services.map((service) => (
                            <li key={service.id}>
                              <Link
                                href={`/services/${service.id}`}
                                className={cn(
                                  navMegaRowClass,
                                  "hover:bg-white/10",
                                )}
                              >
                                <span className="truncate">{service.name}</span>
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
                  "group snap-start rounded-xl px-3 py-1.5 text-white transition hover:bg-white/10 sm:px-4",
                  navPrimaryLabelClass,
                )}
              >
                Contacto
              </Link>

              {/*
              <Link
                href="/leave-review"
                className={cn(
                  "group snap-start rounded-xl px-3 py-1.5 text-white transition hover:bg-white/10 sm:px-4",
                  navPrimaryLabelClass,
                )}
              >
                Reseñas
              </Link>
              */}
            </nav>
          </div>
        </div>
      </header>

      <StoreCartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        tier={storefrontPriceTier}
      />

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
                className="flex h-[calc(100dvh-57px)] flex-col overflow-hidden overscroll-contain bg-[#e4e7ec]"
                aria-label="Principal móvil"
              >
                <div className="relative min-h-0 flex-1 overflow-hidden">
                  <div
                    className={cn(
                      "flex h-full transition-transform duration-300 ease-out motion-reduce:transition-none",
                    )}
                    style={{
                      width: `${mobileNavStack.length * 100}%`,
                      transform: `translateX(-${((mobileNavStack.length - 1) * 100) / mobileNavStack.length}%)`,
                    }}
                  >
                    {mobileNavStack.map((panel) => (
                      <div
                        key={mobileNavPanelKey(panel)}
                        className="flex h-full max-h-full shrink-0 flex-col overflow-hidden"
                        style={{ width: `${100 / mobileNavStack.length}%` }}
                      >
                        {panel.kind === "root" ? (
                          <div className="grid min-h-0 flex-1 auto-rows-min gap-0.5 overflow-y-auto overscroll-contain p-3">
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
                            <button
                              type="button"
                              className={cn(
                                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-muted",
                                navPrimaryLabelClass,
                              )}
                              onClick={() =>
                                pushMobileNavPanel({ kind: "categories" })
                              }
                            >
                              Categorías
                              <ChevronRight
                                className="h-4 w-4 shrink-0 opacity-80"
                                aria-hidden
                              />
                            </button>
                            <button
                              type="button"
                              className={cn(
                                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-muted",
                                navPrimaryLabelClass,
                              )}
                              onClick={() =>
                                pushMobileNavPanel({ kind: "security" })
                              }
                            >
                              Sistema de Seguridad
                              <ChevronRight
                                className="h-4 w-4 shrink-0 opacity-80"
                                aria-hidden
                              />
                            </button>
                            <button
                              type="button"
                              className={cn(
                                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-muted",
                                navPrimaryLabelClass,
                              )}
                              onClick={() =>
                                pushMobileNavPanel({ kind: "brands" })
                              }
                            >
                              Ver Marcas
                              <ChevronRight
                                className="h-4 w-4 shrink-0 opacity-80"
                                aria-hidden
                              />
                            </button>
                            <button
                              type="button"
                              className={cn(
                                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-muted",
                                navPrimaryLabelClass,
                              )}
                              onClick={() =>
                                pushMobileNavPanel({ kind: "services" })
                              }
                            >
                              Servicios
                              <ChevronRight
                                className="h-4 w-4 shrink-0 opacity-80"
                                aria-hidden
                              />
                            </button>
                            <Link
                              href="/contact"
                              onClick={() => setMobileNavOpen(false)}
                              className={cn(
                                "rounded-lg px-3 py-2 transition hover:bg-muted",
                                navPrimaryLabelClass,
                              )}
                            >
                              Contacto
                            </Link>
                            {/*
                            <Link
                              href="/leave-review"
                              onClick={() => setMobileNavOpen(false)}
                              className={cn(
                                "rounded-lg px-3 py-2 transition hover:bg-muted",
                                navPrimaryLabelClass,
                              )}
                            >
                              Reseñas
                            </Link>
                            */}
                            {user ? (
                              <>
                                <div className="mt-1 border-t border-border/70 px-3 pt-3">
                                  <div className="flex gap-3 pb-2">
                                    <span
                                      className={cn(
                                        publicUserAvatarClass,
                                        "h-10 w-10 text-base",
                                      )}
                                      aria-hidden
                                    >
                                      {userInitial}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-semibold text-foreground">
                                        {displayName}
                                      </p>
                                      <p className="truncate text-xs text-muted-foreground">
                                        {user.email}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                {isAdminPublicUser ? (
                                  <>
                                    <Link
                                      href="/admin/home"
                                      onClick={() => setMobileNavOpen(false)}
                                      className={cn(
                                        "flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-muted",
                                        navPrimaryLabelClass,
                                      )}
                                    >
                                      <LayoutDashboard
                                        className="h-4 w-4"
                                        strokeWidth={2}
                                      />
                                      Panel de administración
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
                                        <LogOut
                                          className="h-4 w-4 shrink-0"
                                          aria-hidden
                                        />
                                        Cerrar sesión
                                      </button>
                                    </form>
                                  </>
                                ) : (
                                  <>
                                    <Link
                                      href="/cuenta"
                                      onClick={() => setMobileNavOpen(false)}
                                      className={cn(
                                        "flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-muted",
                                        navPrimaryLabelClass,
                                      )}
                                    >
                                      <UserRound
                                        className="h-4 w-4 shrink-0"
                                        strokeWidth={2}
                                        aria-hidden
                                      />
                                      Mi cuenta
                                    </Link>
                                    <Link
                                      href="/cuenta?tab=orders"
                                      onClick={() => setMobileNavOpen(false)}
                                      className={cn(
                                        "flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-muted",
                                        navPrimaryLabelClass,
                                      )}
                                    >
                                      <Package
                                        className="h-4 w-4 shrink-0"
                                        strokeWidth={2}
                                        aria-hidden
                                      />
                                      Pedidos
                                    </Link>
                                    <Link
                                      href="/cuenta?tab=addresses"
                                      onClick={() => setMobileNavOpen(false)}
                                      className={cn(
                                        "flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-muted",
                                        navPrimaryLabelClass,
                                      )}
                                    >
                                      <MapPin
                                        className="h-4 w-4 shrink-0"
                                        strokeWidth={2}
                                        aria-hidden
                                      />
                                      Direcciones
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
                                        <LogOut
                                          className="h-4 w-4 shrink-0"
                                          aria-hidden
                                        />
                                        Cerrar sesión
                                      </button>
                                    </form>
                                  </>
                                )}
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
                                  <UserRoundPlus
                                    className="h-4 w-4"
                                    strokeWidth={2}
                                  />
                                  Crear cuenta
                                </Link>
                                <div
                                  className="my-1 border-t border-border/70"
                                  aria-hidden
                                />
                                <Link
                                  href="/cuenta?tab=orders"
                                  onClick={() => setMobileNavOpen(false)}
                                  className={cn(
                                    "flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-muted",
                                    navPrimaryLabelClass,
                                  )}
                                >
                                  <Package
                                    className="h-4 w-4 shrink-0"
                                    strokeWidth={2}
                                    aria-hidden
                                  />
                                  Pedidos
                                </Link>
                                <Link
                                  href="/cuenta?tab=addresses"
                                  onClick={() => setMobileNavOpen(false)}
                                  className={cn(
                                    "flex items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-muted",
                                    navPrimaryLabelClass,
                                  )}
                                >
                                  <MapPin
                                    className="h-4 w-4 shrink-0"
                                    strokeWidth={2}
                                    aria-hidden
                                  />
                                  Direcciones
                                </Link>
                              </>
                            )}
                          </div>
                        ) : panel.kind === "security" ? (
                          <>
                            <button
                              type="button"
                              onClick={popMobileNavPanel}
                              className={cn(
                                "flex w-full shrink-0 items-center gap-2 border-b border-border/60 bg-[#e4e7ec] px-3 py-2.5 text-left transition hover:bg-muted/60",
                              )}
                              aria-label="Volver al menú principal"
                            >
                              <ChevronLeft
                                className="h-5 w-5 shrink-0"
                                aria-hidden
                              />
                              <span
                                className={cn(
                                  "min-w-0 flex-1 truncate",
                                  navPrimaryLabelClass,
                                )}
                              >
                                Sistema de Seguridad
                              </span>
                            </button>
                            <div className="grid min-h-0 flex-1 auto-rows-min gap-0.5 overflow-y-auto overscroll-contain p-3">
                              {navLoading ? (
                                <div
                                  className="flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground"
                                  role="status"
                                >
                                  <Loader2 className="h-8 w-8 animate-spin" />
                                  <span className="text-xs uppercase tracking-widest">
                                    Cargando
                                  </span>
                                </div>
                              ) : (
                                (navData?.characteristicsGeneral ?? []).map(
                                  (general) =>
                                    general.specifics.length > 0 ? (
                                      <details
                                        key={general.id}
                                        className="group rounded-lg"
                                      >
                                        <summary
                                          className={cn(
                                            "flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-2 transition hover:bg-muted [&::-webkit-details-marker]:hidden",
                                            mobileNavCatalogHeadingClass,
                                          )}
                                        >
                                          <span className="truncate">
                                            Ver por {general.name}
                                          </span>
                                          <ChevronDown
                                            className="h-4 w-4 shrink-0 opacity-80 transition-transform duration-200 group-open:-rotate-180"
                                            aria-hidden
                                          />
                                        </summary>
                                        <div className="grid gap-0.5 pl-4 pt-0.5">
                                          {general.specifics.map((specific) => (
                                            <Link
                                              key={specific.id}
                                              href={`/security-system/${general.id}/${specific.id}`}
                                              onClick={() =>
                                                setMobileNavOpen(false)
                                              }
                                              className={cn(
                                                "block rounded-lg px-3 py-2 transition hover:bg-muted",
                                                mobileNavCatalogRowClass,
                                              )}
                                            >
                                              {specific.name}
                                            </Link>
                                          ))}
                                        </div>
                                      </details>
                                    ) : (
                                      <div
                                        key={general.id}
                                        className={cn(
                                          "rounded-lg px-3 py-2 text-left",
                                          mobileNavCatalogHeadingClass,
                                        )}
                                      >
                                        Ver por {general.name}
                                      </div>
                                    ),
                                )
                              )}
                            </div>
                          </>
                        ) : panel.kind === "brands" ? (
                          <>
                            <button
                              type="button"
                              onClick={popMobileNavPanel}
                              className={cn(
                                "flex w-full shrink-0 items-center gap-2 border-b border-border/60 bg-[#e4e7ec] px-3 py-2.5 text-left transition hover:bg-muted/60",
                              )}
                              aria-label="Volver al menú principal"
                            >
                              <ChevronLeft
                                className="h-5 w-5 shrink-0"
                                aria-hidden
                              />
                              <span
                                className={cn(
                                  "min-w-0 flex-1 truncate",
                                  navPrimaryLabelClass,
                                )}
                              >
                                Ver Marcas
                              </span>
                            </button>
                            <div className="grid min-h-0 flex-1 auto-rows-min gap-0.5 overflow-y-auto overscroll-contain p-3">
                              {navLoading ? (
                                <div
                                  className="flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground"
                                  role="status"
                                >
                                  <Loader2 className="h-8 w-8 animate-spin" />
                                  <span className="text-xs uppercase tracking-widest">
                                    Cargando
                                  </span>
                                </div>
                              ) : (
                                (navData?.brands ?? []).map((brand) => {
                                  const hasTypes = brand.brandTypes.length > 0;
                                  return hasTypes ? (
                                    <details
                                      key={brand.id}
                                      className="group rounded-lg"
                                    >
                                      <summary
                                        className={cn(
                                          "flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-2 transition hover:bg-muted [&::-webkit-details-marker]:hidden",
                                          mobileNavCatalogHeadingClass,
                                        )}
                                      >
                                        <span className="truncate">
                                          {brand.name}
                                        </span>
                                        <ChevronDown
                                          className="h-4 w-4 shrink-0 opacity-80 transition-transform duration-200 group-open:-rotate-180"
                                          aria-hidden
                                        />
                                      </summary>
                                      <div className="grid gap-0.5 pt-0.5">
                                        {brand.brandTypes.map((type) => (
                                          <Link
                                            key={type.id}
                                            href={`/brands/${brand.id}/${type.id}`}
                                            onClick={() =>
                                              setMobileNavOpen(false)
                                            }
                                            className={cn(
                                              "block rounded-lg px-3 py-2 transition hover:bg-muted",
                                              mobileNavCatalogRowClass,
                                            )}
                                          >
                                            {type.name}
                                          </Link>
                                        ))}
                                      </div>
                                    </details>
                                  ) : (
                                    <Link
                                      key={brand.id}
                                      href={`/brands/${brand.id}`}
                                      onClick={() => setMobileNavOpen(false)}
                                      className={cn(
                                        "rounded-lg px-3 py-2 transition hover:bg-muted",
                                        mobileNavCatalogHeadingClass,
                                      )}
                                    >
                                      {brand.name}
                                    </Link>
                                  );
                                })
                              )}
                            </div>
                          </>
                        ) : panel.kind === "categories" ? (
                          <>
                            <button
                              type="button"
                              onClick={popMobileNavPanel}
                              className={cn(
                                "flex w-full shrink-0 items-center gap-2 border-b border-border/60 bg-[#e4e7ec] px-3 py-2.5 text-left transition hover:bg-muted/60",
                              )}
                              aria-label="Volver al menú principal"
                            >
                              <ChevronLeft
                                className="h-5 w-5 shrink-0"
                                aria-hidden
                              />
                              <span
                                className={cn(
                                  "min-w-0 flex-1 truncate",
                                  navPrimaryLabelClass,
                                )}
                              >
                                Categorías
                              </span>
                            </button>
                            <div className="grid min-h-0 flex-1 auto-rows-min gap-0.5 overflow-y-auto overscroll-contain p-3">
                              {navLoading ? (
                                <div
                                  className="flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground"
                                  role="status"
                                >
                                  <Loader2 className="h-8 w-8 animate-spin" />
                                  <span className="text-xs uppercase tracking-widest">
                                    Cargando
                                  </span>
                                </div>
                              ) : (
                                <>
                                  <Link
                                    href="/categorias"
                                    onClick={() => setMobileNavOpen(false)}
                                    className={cn(
                                      "rounded-lg px-3 py-2 transition hover:bg-muted",
                                      mobileNavCatalogHeadingClass,
                                    )}
                                  >
                                    Ver todas las categorías
                                  </Link>
                                  {(navData?.catalogCategories ?? []).map(
                                    (cat) => {
                                      const hasSubs =
                                        cat.subcategories.length > 0;
                                      return hasSubs ? (
                                        <details
                                          key={cat.id}
                                          className="group rounded-lg"
                                        >
                                          <summary
                                            className={cn(
                                              "flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-2 transition hover:bg-muted [&::-webkit-details-marker]:hidden",
                                              mobileNavCatalogHeadingClass,
                                            )}
                                          >
                                            <span className="truncate">
                                              {cat.name}
                                            </span>
                                            <ChevronDown
                                              className="h-4 w-4 shrink-0 opacity-80 transition-transform duration-200 group-open:-rotate-180"
                                              aria-hidden
                                            />
                                          </summary>
                                          <div className="grid gap-0.5 pt-0.5">
                                            {cat.subcategories.map((sub) => (
                                              <Link
                                                key={sub.id}
                                                href={`/catalogo/${cat.id}/${sub.id}`}
                                                onClick={() =>
                                                  setMobileNavOpen(false)
                                                }
                                                className={cn(
                                                  "block rounded-lg px-3 py-2 transition hover:bg-muted",
                                                  mobileNavCatalogRowClass,
                                                )}
                                              >
                                                {sub.name}
                                              </Link>
                                            ))}
                                          </div>
                                        </details>
                                      ) : (
                                        <Link
                                          key={cat.id}
                                          href={`/catalogo/${cat.id}`}
                                          onClick={() =>
                                            setMobileNavOpen(false)
                                          }
                                          className={cn(
                                            "rounded-lg px-3 py-2 transition hover:bg-muted",
                                            mobileNavCatalogHeadingClass,
                                          )}
                                        >
                                          {cat.name}
                                        </Link>
                                      );
                                    },
                                  )}
                                </>
                              )}
                            </div>
                          </>
                        ) : panel.kind === "services" ? (
                          <>
                            <button
                              type="button"
                              onClick={popMobileNavPanel}
                              className={cn(
                                "flex w-full shrink-0 items-center gap-2 border-b border-border/60 bg-[#e4e7ec] px-3 py-2.5 text-left transition hover:bg-muted/60",
                              )}
                              aria-label="Volver al menú principal"
                            >
                              <ChevronLeft
                                className="h-5 w-5 shrink-0"
                                aria-hidden
                              />
                              <span
                                className={cn(
                                  "min-w-0 flex-1 truncate",
                                  navPrimaryLabelClass,
                                )}
                              >
                                Servicios
                              </span>
                            </button>
                            <div className="grid min-h-0 flex-1 auto-rows-min gap-0.5 overflow-y-auto overscroll-contain p-3">
                              {navLoading ? (
                                <div
                                  className="flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground"
                                  role="status"
                                >
                                  <Loader2 className="h-8 w-8 animate-spin" />
                                  <span className="text-xs uppercase tracking-widest">
                                    Cargando
                                  </span>
                                </div>
                              ) : (
                                (navData?.services ?? []).map((service) => (
                                  <Link
                                    key={service.id}
                                    href={`/services/${service.id}`}
                                    onClick={() => setMobileNavOpen(false)}
                                    className={cn(
                                      "rounded-lg px-3 py-2 transition hover:bg-muted",
                                      mobileNavCatalogHeadingClass,
                                    )}
                                  >
                                    {service.name}
                                  </Link>
                                ))
                              )}
                            </div>
                          </>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </nav>
            </aside>
          </div>,
          document.body,
        )}
    </>
  );
}
