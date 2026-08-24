"use client";

import { AppLogo } from "@/components/brand/AppLogo";
import { LanguageSelector } from "@/components/i18n/LanguageSelector";
import { useI18n } from "@/components/i18n/I18nProvider";
import { SearchAutocompleteDropdown } from "@/components/marketing/SearchAutocompleteDropdown";
import { useDropdownPresence } from "@/components/marketing/useDropdownPresence";
import { StoreCartDrawer } from "@/components/store/StoreCartDrawer";
import { useGcCart } from "@/components/store/useGcCart";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { SITE_BRAND_NAME } from "@/lib/site";
import { GC_CART_OPEN_EVENT, gcCartTotalUnits } from "@/lib/store-cart";
import { resolveStorefrontPriceTier } from "@/lib/storefront-pricing";
import { slugify } from "@/lib/slugify";
import type { SessionUser } from "@/modules/auth/auth.types";
import type {
  NavigationBrand,
  NavigationBrandType,
  NavigationCatalogCategory,
  NavigationCatalogSubcategory,
  NavigationCharacteristicGeneral,
  NavigationCharacteristicSpecific,
  NavigationData,
  NavigationService,
} from "@/modules/navigation/navigation.types";
import { cn } from "@/utils/cn";
import {
  Briefcase,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
  LayoutDashboard,
  LayoutGrid,
  Loader2,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Package,
  Shield,
  ShoppingCart,
  Tags,
  UserRound,
  UserRoundPlus,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

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

const navMegaCascadeWidthClass = "w-[min(100vw-2rem,16rem)]";

/**
 * Posiciona el submenú alineado con la fila activa, sin que el scroll
 * del listado principal lo recorte. Ajusta hacia arriba si se sale del viewport.
 */
function useNavCascadeSubmenuTop(activeId: string | null) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<string, HTMLElement>());
  const [top, setTop] = useState(0);

  const setRowRef = (id: string, el: HTMLElement | null) => {
    if (el) rowRefs.current.set(id, el);
    else rowRefs.current.delete(id);
  };

  useLayoutEffect(() => {
    const update = () => {
      if (!activeId || !rootRef.current) {
        setTop(0);
        return;
      }
      const row = rowRefs.current.get(activeId);
      if (!row) return;

      // Primera opción: alinear el submenú con el tope del panel principal.
      const firstRow = scrollRef.current?.firstElementChild;
      if (firstRow && row === firstRow) {
        setTop(0);
        return;
      }

      const rootRect = rootRef.current.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      let next = rowRect.top - rootRect.top;
      const panel = submenuRef.current;
      if (panel) {
        const styles = getComputedStyle(panel);
        const padTop = Number.parseFloat(styles.paddingTop) || 0;
        const borderTop = Number.parseFloat(styles.borderTopWidth) || 0;
        next -= padTop + borderTop;

        // Aplicar tentativamente para medir la 1ª subopción real y corregir.
        const prevTop = panel.style.top;
        panel.style.top = `${Math.max(0, next)}px`;
        const firstSubRow = panel.querySelector<HTMLElement>(
          "a, [role='presentation']",
        );
        if (firstSubRow) {
          next -= firstSubRow.getBoundingClientRect().top - rowRect.top;
        }

        const overflow =
          rootRect.top + next + panel.offsetHeight - (window.innerHeight - 8);
        if (overflow > 0) next -= overflow;
        next = Math.max(0, next);
        panel.style.top = prevTop;
      }
      setTop(next);
    };

    update();
    const raf = requestAnimationFrame(update);
    const scrollEl = scrollRef.current;
    scrollEl?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      scrollEl?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [activeId]);

  return { rootRef, scrollRef, submenuRef, setRowRef, top };
}

function NavMegaCascadeShell({
  megaPanelClass,
  loading,
  onMouseLeave,
  activeId,
  submenu,
  children,
}: {
  megaPanelClass: string;
  loading: boolean;
  onMouseLeave: () => void;
  activeId: string | null;
  submenu: ReactNode | null;
  children: (setRowRef: (id: string, el: HTMLElement | null) => void) => ReactNode;
}) {
  const { rootRef, scrollRef, submenuRef, setRowRef, top } =
    useNavCascadeSubmenuTop(activeId);

  return (
    <div
      ref={rootRef}
      className={cn("relative font-roboto", navMegaCascadeWidthClass)}
      onMouseLeave={onMouseLeave}
    >
      {loading ? (
        <div className={cn(megaPanelClass, navMegaCascadeWidthClass)}>
          <NavMegaMenuLoading />
        </div>
      ) : (
        <>
          <div
            ref={scrollRef}
            className={cn(
              megaPanelClass,
              "max-h-[70vh] overflow-y-auto py-2",
            )}
          >
            {children(setRowRef)}
          </div>
          {submenu ? (
            <div
              ref={submenuRef}
              className={cn(
                megaPanelClass,
                navMegaCascadeWidthClass,
                "absolute left-full z-10 max-h-[70vh] overflow-y-auto border-l-0 py-2",
              )}
              style={{ top }}
            >
              {submenu}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

const desktopNavPrimaryLabelClass =
  "font-roboto text-[15px] font-light leading-none";

const desktopNavRowHeightClass = "h-10";

const desktopNavUnderlineClass =
  "pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-white transition-transform duration-200 ease-out";

function DesktopNavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group/navitem flex snap-start items-center pr-3 sm:pr-4",
        desktopNavRowHeightClass,
        desktopNavPrimaryLabelClass,
      )}
    >
      <span className="relative inline-flex h-full items-center">
        <span>{children}</span>
        <span
          aria-hidden
          className={cn(
            desktopNavUnderlineClass,
            "group-hover/navitem:scale-x-100",
          )}
        />
      </span>
    </Link>
  );
}

function DesktopNavDropdownTrigger({
  label,
  hoverClass,
}: {
  label: string;
  hoverClass: string;
}) {
  return (
    <span
      className={cn(
        "flex cursor-pointer snap-start items-center pr-3 sm:pr-4",
        desktopNavRowHeightClass,
        desktopNavPrimaryLabelClass,
      )}
    >
      <span className="relative inline-flex h-full items-center">
        <span className="inline-flex items-center gap-1">
          <span>{label}</span>
          <ChevronDown
            className="h-3.5 w-3.5 shrink-0"
            strokeWidth={2.75}
            aria-hidden
          />
        </span>
        <span
          aria-hidden
          className={cn(desktopNavUnderlineClass, hoverClass)}
        />
      </span>
    </span>
  );
}

type Props = {
  user: SessionUser | null;
};

const ensureSlug = (name: string, slug?: string | null) =>
  slug?.trim() ? slug : slugify(name);

const catalogCategoryUrl = (category: NavigationCatalogCategory) =>
  `/catalog/${ensureSlug(category.name, category.slug)}`;

const catalogSubcategoryUrl = (
  category: NavigationCatalogCategory,
  subcategory: NavigationCatalogSubcategory,
) =>
  `${catalogCategoryUrl(category)}/${ensureSlug(subcategory.name, subcategory.slug)}`;

const catalogBrandUrl = (brand: NavigationBrand) =>
  `/brands/${ensureSlug(brand.name, brand.slug)}`;

const catalogBrandTypeUrl = (
  brand: NavigationBrand,
  type: NavigationBrandType,
) => `${catalogBrandUrl(brand)}/${ensureSlug(type.name, type.slug)}`;

const catalogGeneralUrl = (general: NavigationCharacteristicGeneral) =>
  `/security-system/${ensureSlug(general.name, general.slug)}`;

const catalogSpecificUrl = (
  general: NavigationCharacteristicGeneral,
  specific: NavigationCharacteristicSpecific,
) =>
  `${catalogGeneralUrl(general)}/${ensureSlug(specific.name, specific.slug)}`;

const catalogServiceUrl = (service: NavigationService) =>
  `/services/${ensureSlug(service.name, service.slug)}`;

/** Paneles del menú móvil (deslizamiento horizontal). */
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

/**
 * Fila móvil: el nombre navega (como en desktop); el chevron abre hijos.
 */
function MobileNavSplitRow({
  href,
  label,
  headingClassName,
  expandLabel,
  collapseLabel,
  onNavigate,
  children,
}: {
  href: string;
  label: string;
  headingClassName: string;
  expandLabel: string;
  collapseLabel: string;
  onNavigate: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg">
      <div className="flex items-stretch">
        <Link
          href={href}
          onClick={onNavigate}
          className={cn(
            "min-w-0 flex-1 rounded-lg px-3 py-2 transition hover:bg-muted",
            headingClassName,
          )}
        >
          <span className="block truncate">{label}</span>
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? collapseLabel : expandLabel}
          onClick={() => setOpen((v) => !v)}
          className="flex shrink-0 items-center justify-center rounded-lg px-3 py-2 text-foreground/80 transition hover:bg-muted"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 opacity-80 transition-transform duration-200",
              open && "-rotate-180",
            )}
            aria-hidden
          />
        </button>
      </div>
      {open ? (
        <div className="grid gap-0.5 pl-4 pt-0.5">{children}</div>
      ) : null}
    </div>
  );
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
    if (pathname === "/cart") {
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
    "overflow-hidden rounded-none border border-white/10 bg-primary text-left text-white shadow-md";

  /** Mismo inset horizontal que las secciones del landing (hero, destacados, etc.). */
  const landingInsetClass = "px-4 sm:px-6 lg:px-8";

  /** Contenedor centrado del landing (`max-w-7xl` + inset). */
  const landingContainerClass = cn("mx-auto max-w-7xl", landingInsetClass);

  const navMegaRowClass =
    "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-white/95 transition";

  /** Barra principal y drawer: 15px, peso 500 */
  const navPrimaryLabelClass = "font-roboto text-[15px] font-medium";

  /** Generales / marcas (cabecera de fila o desplegable) en menú móvil. */
  const mobileNavCatalogHeadingClass = "text-sm font-bold text-foreground/90";

  /** Específicos y tipos por marca (subenlaces). */
  const mobileNavCatalogRowClass = "text-sm font-medium text-foreground/90";

  /** Icono a la izquierda en el menú móvil/tablet (`lg:hidden`). */
  const mobileNavRootIconClass = "h-4 w-4 shrink-0 text-foreground/80";

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
  const { t, locale } = useI18n();
  const localizeName = (value: { name: string; nameEn?: string | null }) =>
    locale === "en" ? (value.nameEn ?? value.name) : value.name;
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
            "overflow-visible",
            "grid-rows-[1fr] opacity-100",
          )}
        >
          <div className="min-h-0 overflow-visible">
            <div
              className={cn(
                "mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-1.5 gap-y-2 px-2.5 py-2 sm:min-h-[3.75rem] sm:grid-cols-[auto_auto_minmax(10rem,1fr)_auto_auto] sm:items-center sm:gap-x-2.5 sm:px-3 sm:pb-2",
              )}
            >
              <button
                type="button"
                onClick={() => setMobileNavOpen((v) => !v)}
                className="row-start-1 col-start-1 rounded-lg pl-1 text-foreground transition hover:bg-muted/80"
                aria-label={
                  mobileNavOpen ? t("header.closeMenu") : t("header.openMenu")
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

              <SearchAutocompleteDropdown
                priceTier={storefrontPriceTier}
                className="col-span-4 row-start-2 block min-w-0 sm:col-span-1 sm:col-start-3 sm:row-start-1"
                inputClassName="h-10 w-full rounded-full border border-border/70 bg-white/80 py-2 pl-3 pr-11 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/80 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/25 sm:h-9 sm:py-1.5 sm:text-[13px]"
                dropdownClassName="left-0 right-0"
              />
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
                      aria-label={t("header.myAccount")}
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
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest("a, button")) {
                              setAccountOpen(false);
                            }
                          }}
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
                                {t("header.adminPanel")}
                              </Link>
                              <form action="/auth/logout" method="post">
                                <button
                                  type="submit"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
                                >
                                  <LogOut className="h-4 w-4" />
                                  {t("header.logout")}
                                </button>
                              </form>
                            </>
                          ) : (
                            <>
                              <Link
                                href="/profile"
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                onClick={() => setAccountOpen(false)}
                              >
                                <UserRound
                                  className="h-4 w-4 shrink-0"
                                  strokeWidth={1.35}
                                  aria-hidden
                                />
                                {t("header.myAccount")}
                              </Link>
                              <Link
                                href="/profile?tab=orders"
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                onClick={() => setAccountOpen(false)}
                              >
                                <Package
                                  className="h-4 w-4 shrink-0"
                                  strokeWidth={1.35}
                                  aria-hidden
                                />
                                {t("header.orders")}
                              </Link>
                              <Link
                                href="/profile?tab=addresses"
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                onClick={() => setAccountOpen(false)}
                              >
                                <MapPin
                                  className="h-4 w-4 shrink-0"
                                  strokeWidth={1.35}
                                  aria-hidden
                                />
                                {t("header.addresses")}
                              </Link>
                              <form action="/auth/logout" method="post">
                                <button
                                  type="submit"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
                                >
                                  <LogOut className="h-4 w-4" />
                                  {t("header.logout")}
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
                    aria-label={t("header.signIn")}
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
                aria-label={`${t("header.nav.cart")} (${cartCount} ${cartCount === 1 ? t("header.itemOne") : t("header.itemMany")})`}
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
            "overflow-visible",
            "relative z-[80] grid-rows-[1fr] opacity-100",
          )}
        >
          <div className="min-h-0 overflow-visible">
            <div className="mx-auto hidden min-h-[4rem] max-w-7xl grid-cols-[auto_minmax(12rem,1fr)_auto] items-center gap-x-2 px-4 py-2 sm:min-h-[4.75rem] sm:gap-x-3 sm:px-6 lg:grid lg:px-8">
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
                      {t("header.brandTagline")}
                    </span>
                  </span>
                </Link>
              </div>

              <div className="w-full min-w-[min(100%,12rem)] px-1 sm:px-2 lg:px-3 xl:px-4">
                <SearchAutocompleteDropdown
                  priceTier={storefrontPriceTier}
                  inputClassName="h-11 w-full rounded-full border border-border/70 bg-white/80 py-2 pl-4 pr-12 text-sm outline-none ring-offset-background transition placeholder:text-brand-gray-light focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/25 sm:h-12 sm:pl-5 sm:pr-14"
                />
              </div>

              <div className="flex min-w-0 justify-self-end gap-0.5 sm:gap-2">
                <LanguageSelector
                  className="hidden gap-1 sm:flex"
                  buttonClassName="bg-muted/80"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  className="shrink-0 gap-2 rounded-xl px-2.5 hover:bg-transparent hover:text-foreground md:order-2 md:px-3"
                  aria-label={`${t("header.nav.cart")} (${cartCount} ${cartCount === 1 ? t("header.itemOne") : t("header.itemMany")})`}
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
                    {t("header.nav.cart")}
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
                          "h-9 max-w-[220px] gap-2 rounded-xl hover:bg-transparent hover:text-foreground",
                        )}
                        aria-expanded={accountOpen}
                        aria-haspopup="menu"
                      >
                        <span
                          className={cn(publicUserAvatarClass, "h-9 w-9")}
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
                            onClick={(e) => {
                              if ((e.target as HTMLElement).closest("a, button")) {
                                setAccountOpen(false);
                              }
                            }}
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
                                  {t("header.adminPanel")}
                                </Link>
                                <form action="/auth/logout" method="post">
                                  <button
                                    type="submit"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
                                    role="menuitem"
                                  >
                                    <LogOut className="h-4 w-4" />
                                    {t("header.logout")}
                                  </button>
                                </form>
                              </>
                            ) : (
                              <>
                                <Link
                                  href="/profile"
                                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                  role="menuitem"
                                  onClick={() => setAccountOpen(false)}
                                >
                                  <UserRound
                                    className="h-4 w-4"
                                    strokeWidth={1.35}
                                  />
                                  {t("header.myAccount")}
                                </Link>
                                <Link
                                  href="/profile?tab=orders"
                                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                  role="menuitem"
                                  onClick={() => setAccountOpen(false)}
                                >
                                  <Package
                                    className="h-4 w-4 shrink-0"
                                    strokeWidth={1.35}
                                    aria-hidden
                                  />
                                  {t("header.orders")}
                                </Link>
                                <Link
                                  href="/profile?tab=addresses"
                                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                  role="menuitem"
                                  onClick={() => setAccountOpen(false)}
                                >
                                  <MapPin
                                    className="h-4 w-4 shrink-0"
                                    strokeWidth={1.35}
                                    aria-hidden
                                  />
                                  {t("header.addresses")}
                                </Link>
                                <form action="/auth/logout" method="post">
                                  <button
                                    type="submit"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
                                    role="menuitem"
                                  >
                                    <LogOut className="h-4 w-4" />
                                    {t("header.logout")}
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
                        <span>{t("header.account")}</span>
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
                              {t("header.signIn")}
                            </Link>
                            <Link
                              href="/register/empresa"
                              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                              role="menuitem"
                              onClick={() => setAccountOpen(false)}
                            >
                              <UserRoundPlus
                                className="h-4 w-4"
                                strokeWidth={1.6}
                              />
                              {t("header.createAccount")}
                            </Link>
                            <div
                              className="my-1 border-t border-border"
                              aria-hidden
                            />
                            <Link
                              href="/profile?tab=orders"
                              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                              role="menuitem"
                              onClick={() => setAccountOpen(false)}
                            >
                              <Package className="h-4 w-4" strokeWidth={1.6} />
                              {t("header.orders")}
                            </Link>
                            <Link
                              href="/profile?tab=addresses"
                              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                              role="menuitem"
                              onClick={() => setAccountOpen(false)}
                            >
                              <MapPin
                                className="h-4 w-4 shrink-0"
                                strokeWidth={1.6}
                                aria-hidden
                              />
                              {t("header.addresses")}
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
              className={cn(
                landingContainerClass,
                desktopNavRowHeightClass,
                "flex flex-wrap items-center justify-start gap-2 overflow-visible sm:gap-3",
              )}
              aria-label={t("header.mainNavLabel")}
            >
              <DesktopNavLink href="/" onClick={handleScrollToTopOnHome}>
                {t("header.nav.home")}
              </DesktopNavLink>

              <div className="group/cat relative flex items-center">
                <DesktopNavDropdownTrigger
                  label={t("header.nav.categories")}
                  hoverClass="group-hover/cat:scale-x-100"
                />
                {(navLoading ||
                  (navData?.catalogCategories?.length ?? 0) > 0) && (
                  <div className="pointer-events-none invisible absolute left-0 top-full z-[60] -mt-1 flex flex-col pt-1 opacity-0 transition-none group-hover/cat:pointer-events-auto group-hover/cat:visible group-hover/cat:opacity-100">
                    <NavMegaCascadeShell
                      megaPanelClass={megaPanelClass}
                      loading={navLoading}
                      activeId={
                        categoryPanelHasSubs ? (hoveredCategoryId ?? null) : null
                      }
                      onMouseLeave={() => setHoveredCategoryId(null)}
                      submenu={
                        categoryPanelHasSubs && activeCategory ? (
                          <ul>
                            {activeCategory.subcategories.map((sub) => (
                              <li key={sub.id}>
                                <Link
                                  href={catalogSubcategoryUrl(
                                    activeCategory,
                                    sub,
                                  )}
                                  onClick={armDesktopNavStripSuppress}
                                  className={cn(
                                    navMegaRowClass,
                                    "hover:bg-white/10",
                                  )}
                                >
                                  <span className="truncate">
                                    {localizeName(sub)}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : null
                      }
                    >
                      {(setRowRef) =>
                        navData!.catalogCategories.map((cat) => {
                          const rowActive = hoveredCategoryId === cat.id;
                          const hasSubs = cat.subcategories.length > 0;
                          return (
                            <Link
                              key={cat.id}
                              ref={(el) => setRowRef(cat.id, el)}
                              href={catalogCategoryUrl(cat)}
                              onMouseEnter={() => setHoveredCategoryId(cat.id)}
                              onClick={armDesktopNavStripSuppress}
                              className={cn(
                                navMegaRowClass,
                                "justify-between",
                                "hover:bg-white/10",
                                rowActive && "bg-white/10",
                              )}
                            >
                              <span className="truncate">
                                {localizeName(cat)}
                              </span>
                              {hasSubs ? (
                                <ChevronRight
                                  className="h-4 w-4 shrink-0 text-white"
                                  aria-hidden
                                />
                              ) : null}
                            </Link>
                          );
                        })
                      }
                    </NavMegaCascadeShell>
                  </div>
                )}
              </div>

              <div className="group/nav relative flex items-center">
                <DesktopNavDropdownTrigger
                  label={t("header.nav.securitySystems")}
                  hoverClass="group-hover/nav:scale-x-100"
                />
                {(navLoading ||
                  (navData?.characteristicsGeneral?.length ?? 0) > 0) && (
                  <div className="pointer-events-none invisible absolute left-0 top-full z-[60] -mt-1 flex flex-col pt-1 opacity-0 transition-none group-hover/nav:pointer-events-auto group-hover/nav:visible group-hover/nav:opacity-100">
                    <NavMegaCascadeShell
                      megaPanelClass={megaPanelClass}
                      loading={navLoading}
                      activeId={
                        generalPanelHasSubs ? (hoveredGeneralId ?? null) : null
                      }
                      onMouseLeave={() => setHoveredGeneralId(null)}
                      submenu={
                        generalPanelHasSubs && activeGeneral ? (
                          <ul>
                            {activeGeneral.specifics.map((specific) => (
                              <li key={specific.id}>
                                <Link
                                  href={catalogSpecificUrl(
                                    activeGeneral,
                                    specific,
                                  )}
                                  onClick={armDesktopNavStripSuppress}
                                  className={cn(
                                    navMegaRowClass,
                                    "hover:bg-white/10",
                                  )}
                                >
                                  <span className="truncate">
                                    {localizeName(specific)}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : null
                      }
                    >
                      {(setRowRef) =>
                        navData!.characteristicsGeneral.map((general) => {
                          const rowActive = hoveredGeneralId === general.id;
                          const hasSubs = general.specifics.length > 0;
                          return (
                            <div
                              key={general.id}
                              ref={(el) => setRowRef(general.id, el)}
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
                                {t("header.viewBy")} {localizeName(general)}
                              </span>
                              {hasSubs ? (
                                <ChevronRight
                                  className="h-4 w-4 shrink-0 text-white"
                                  aria-hidden
                                />
                              ) : null}
                            </div>
                          );
                        })
                      }
                    </NavMegaCascadeShell>
                  </div>
                )}
              </div>

              <div className="group/shop relative flex items-center">
                <DesktopNavDropdownTrigger
                  label={t("header.nav.brands")}
                  hoverClass="group-hover/shop:scale-x-100"
                />
                {(navLoading || (navData?.brands?.length ?? 0) > 0) && (
                  <div className="pointer-events-none invisible absolute left-0 top-full z-[60] -mt-1 flex flex-col pt-1 opacity-0 transition-none group-hover/shop:pointer-events-auto group-hover/shop:visible group-hover/shop:opacity-100">
                    <NavMegaCascadeShell
                      megaPanelClass={megaPanelClass}
                      loading={navLoading}
                      activeId={
                        brandPanelHasSubs ? (hoveredBrandId ?? null) : null
                      }
                      onMouseLeave={() => setHoveredBrandId(null)}
                      submenu={
                        brandPanelHasSubs && activeBrand ? (
                          <ul>
                            {activeBrand.brandTypes.map((type) => (
                              <li key={type.id}>
                                <Link
                                  href={catalogBrandTypeUrl(activeBrand, type)}
                                  onClick={armDesktopNavStripSuppress}
                                  className={cn(
                                    navMegaRowClass,
                                    "hover:bg-white/10",
                                  )}
                                >
                                  <span className="truncate">
                                    {localizeName(type)}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : null
                      }
                    >
                      {(setRowRef) =>
                        navData!.brands.map((brand) => {
                          const rowActive = hoveredBrandId === brand.id;
                          const hasSubs = brand.brandTypes.length > 0;
                          return (
                            <Link
                              key={brand.id}
                              ref={(el) => setRowRef(brand.id, el)}
                              href={catalogBrandUrl(brand)}
                              onMouseEnter={() => setHoveredBrandId(brand.id)}
                              onClick={armDesktopNavStripSuppress}
                              className={cn(
                                navMegaRowClass,
                                "justify-between",
                                "hover:bg-white/10",
                                rowActive && "bg-white/10",
                              )}
                            >
                              <span className="truncate">
                                {localizeName(brand)}
                              </span>
                              {hasSubs ? (
                                <ChevronRight
                                  className="h-4 w-4 shrink-0 text-white"
                                  aria-hidden
                                />
                              ) : null}
                            </Link>
                          );
                        })
                      }
                    </NavMegaCascadeShell>
                  </div>
                )}
              </div>

              <div className="group/svc relative flex items-center">
                <DesktopNavDropdownTrigger
                  label={t("header.nav.services")}
                  hoverClass="group-hover/svc:scale-x-100"
                />
                {(navLoading || (navData?.services?.length ?? 0) > 0) && (
                  <div className="pointer-events-none invisible absolute left-0 top-full z-[60] -mt-1 flex flex-col pt-1 opacity-0 transition-none group-hover/svc:pointer-events-auto group-hover/svc:visible group-hover/svc:opacity-100">
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
                                href={catalogServiceUrl(service)}
                                onClick={armDesktopNavStripSuppress}
                                className={cn(
                                  navMegaRowClass,
                                  "hover:bg-white/10",
                                )}
                              >
                                <span className="truncate">
                                  {localizeName(service)}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DesktopNavLink href="/contact">
                {t("header.nav.contact")}
              </DesktopNavLink>

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
              aria-label={t("header.mobileMenuLabel")}
            >
              <div
                className={cn(
                  "flex items-center justify-between border-b border-border/70 bg-[#e4e7ec] py-3",
                  landingInsetClass,
                )}
              >
                <span className="font-roboto text-[15px] font-medium">
                  {t("header.menuTitle")}
                </span>
                <div className="flex items-center gap-2">
                  <LanguageSelector
                    className="rounded-full bg-muted/80 p-0 shadow-sm"
                    buttonClassName="h-8 w-8 text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(false)}
                    className="rounded-lg p-2 transition hover:bg-muted"
                    aria-label={t("header.closeMenu")}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <nav
                className="flex h-[calc(100dvh-57px)] flex-col overflow-hidden overscroll-contain bg-[#e4e7ec]"
                aria-label={t("header.mobilePrimaryNavLabel")}
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
                          <div className="grid min-h-0 flex-1 auto-rows-min gap-0.5 overflow-y-auto overscroll-contain py-3">
                            <Link
                              href="/"
                              onClick={handleScrollToTopOnHome}
                              className={cn(
                                landingInsetClass,
                                "flex items-center gap-2 rounded-lg py-2 transition hover:bg-muted",
                                navPrimaryLabelClass,
                              )}
                            >
                              <Home
                                className={mobileNavRootIconClass}
                                strokeWidth={2}
                                aria-hidden
                              />
                              {t("header.nav.home")}
                            </Link>
                            <button
                              type="button"
                              className={cn(
                                landingInsetClass,
                                "flex w-full items-center justify-between gap-2 rounded-lg py-2 text-left transition hover:bg-muted",
                                navPrimaryLabelClass,
                              )}
                              onClick={() =>
                                pushMobileNavPanel({ kind: "categories" })
                              }
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                <LayoutGrid
                                  className={mobileNavRootIconClass}
                                  strokeWidth={2}
                                  aria-hidden
                                />
                                <span className="truncate">
                                  {t("header.nav.categories")}
                                </span>
                              </span>
                              <ChevronRight
                                className="h-4 w-4 shrink-0 opacity-80"
                                aria-hidden
                              />
                            </button>
                            <button
                              type="button"
                              className={cn(
                                landingInsetClass,
                                "flex w-full items-center justify-between gap-2 rounded-lg py-2 text-left transition hover:bg-muted",
                                navPrimaryLabelClass,
                              )}
                              onClick={() =>
                                pushMobileNavPanel({ kind: "security" })
                              }
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                <Shield
                                  className={mobileNavRootIconClass}
                                  strokeWidth={2}
                                  aria-hidden
                                />
                                <span className="truncate">
                                  {t("header.nav.securitySystems")}
                                </span>
                              </span>
                              <ChevronRight
                                className="h-4 w-4 shrink-0 opacity-80"
                                aria-hidden
                              />
                            </button>
                            <button
                              type="button"
                              className={cn(
                                landingInsetClass,
                                "flex w-full items-center justify-between gap-2 rounded-lg py-2 text-left transition hover:bg-muted",
                                navPrimaryLabelClass,
                              )}
                              onClick={() =>
                                pushMobileNavPanel({ kind: "brands" })
                              }
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                <Tags
                                  className={mobileNavRootIconClass}
                                  strokeWidth={2}
                                  aria-hidden
                                />
                                <span className="truncate">
                                  {t("header.nav.brands")}
                                </span>
                              </span>
                              <ChevronRight
                                className="h-4 w-4 shrink-0 opacity-80"
                                aria-hidden
                              />
                            </button>
                            <button
                              type="button"
                              className={cn(
                                landingInsetClass,
                                "flex w-full items-center justify-between gap-2 rounded-lg py-2 text-left transition hover:bg-muted",
                                navPrimaryLabelClass,
                              )}
                              onClick={() =>
                                pushMobileNavPanel({ kind: "services" })
                              }
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                <Briefcase
                                  className={mobileNavRootIconClass}
                                  strokeWidth={2}
                                  aria-hidden
                                />
                                <span className="truncate">
                                  {t("header.nav.services")}
                                </span>
                              </span>
                              <ChevronRight
                                className="h-4 w-4 shrink-0 opacity-80"
                                aria-hidden
                              />
                            </button>
                            <Link
                              href="/contact"
                              onClick={() => setMobileNavOpen(false)}
                              className={cn(
                                landingInsetClass,
                                "flex items-center gap-2 rounded-lg py-2 transition hover:bg-muted",
                                navPrimaryLabelClass,
                              )}
                            >
                              <Mail
                                className={mobileNavRootIconClass}
                                strokeWidth={2}
                                aria-hidden
                              />
                              {t("header.nav.contact")}
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
                                      {t("header.adminPanel")}
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
                                        {t("header.logout")}
                                      </button>
                                    </form>
                                  </>
                                ) : (
                                  <>
                                    <Link
                                      href="/profile"
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
                                      {t("header.myAccount")}
                                    </Link>
                                    <Link
                                      href="/profile?tab=orders"
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
                                      {t("header.orders")}
                                    </Link>
                                    <Link
                                      href="/profile?tab=addresses"
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
                                      {t("header.addresses")}
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
                                        {t("header.logout")}
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
                                  {t("header.signIn")}
                                </Link>
                                <Link
                                  href="/register/empresa"
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
                                  {t("header.createAccount")}
                                </Link>
                                <div
                                  className="my-1 border-t border-border/70"
                                  aria-hidden
                                />
                                <Link
                                  href="/profile?tab=orders"
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
                                  {t("header.orders")}
                                </Link>
                                <Link
                                  href="/profile?tab=addresses"
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
                                  {t("header.addresses")}
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
                              aria-label={t("header.backToMainMenu")}
                            >
                              <ChevronLeft
                                className="h-5 w-5 shrink-0"
                                aria-hidden
                              />
                              <Shield
                                className={cn(
                                  mobileNavRootIconClass,
                                  "text-foreground/70",
                                )}
                                strokeWidth={2}
                                aria-hidden
                              />
                              <span
                                className={cn(
                                  "min-w-0 flex-1 truncate",
                                  navPrimaryLabelClass,
                                )}
                              >
                                {t("header.nav.securitySystems")}
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
                                            {t("header.viewBy")}{" "}
                                            {localizeName(general)}
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
                                              href={catalogSpecificUrl(
                                                general,
                                                specific,
                                              )}
                                              onClick={() =>
                                                setMobileNavOpen(false)
                                              }
                                              className={cn(
                                                "block rounded-lg px-3 py-2 transition hover:bg-muted",
                                                mobileNavCatalogRowClass,
                                              )}
                                            >
                                              {localizeName(specific)}
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
                                        {t("header.viewBy")}{" "}
                                        {localizeName(general)}
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
                              <Tags
                                className={cn(
                                  mobileNavRootIconClass,
                                  "text-foreground/70",
                                )}
                                strokeWidth={2}
                                aria-hidden
                              />
                              <span
                                className={cn(
                                  "min-w-0 flex-1 truncate",
                                  navPrimaryLabelClass,
                                )}
                              >
                                {t("header.nav.brands")}
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
                                  const brandLabel = localizeName(brand);
                                  return hasTypes ? (
                                    <MobileNavSplitRow
                                      key={brand.id}
                                      href={catalogBrandUrl(brand)}
                                      label={brandLabel}
                                      headingClassName={
                                        mobileNavCatalogHeadingClass
                                      }
                                      expandLabel={t(
                                        "header.expandSubitems",
                                      ).replace("{name}", brandLabel)}
                                      collapseLabel={t(
                                        "header.collapseSubitems",
                                      ).replace("{name}", brandLabel)}
                                      onNavigate={() =>
                                        setMobileNavOpen(false)
                                      }
                                    >
                                      {brand.brandTypes.map((type) => (
                                        <Link
                                          key={type.id}
                                          href={catalogBrandTypeUrl(
                                            brand,
                                            type,
                                          )}
                                          onClick={() =>
                                            setMobileNavOpen(false)
                                          }
                                          className={cn(
                                            "block rounded-lg px-3 py-2 transition hover:bg-muted",
                                            mobileNavCatalogRowClass,
                                          )}
                                        >
                                          {localizeName(type)}
                                        </Link>
                                      ))}
                                    </MobileNavSplitRow>
                                  ) : (
                                    <Link
                                      key={brand.id}
                                      href={catalogBrandUrl(brand)}
                                      onClick={() => setMobileNavOpen(false)}
                                      className={cn(
                                        "rounded-lg px-3 py-2 transition hover:bg-muted",
                                        mobileNavCatalogHeadingClass,
                                      )}
                                    >
                                      {brandLabel}
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
                              <LayoutGrid
                                className={cn(
                                  mobileNavRootIconClass,
                                  "text-foreground/70",
                                )}
                                strokeWidth={2}
                                aria-hidden
                              />
                              <span
                                className={cn(
                                  "min-w-0 flex-1 truncate",
                                  navPrimaryLabelClass,
                                )}
                              >
                                {t("header.nav.categories")}
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
                                (navData?.catalogCategories ?? []).map(
                                  (cat) => {
                                    const hasSubs =
                                      cat.subcategories.length > 0;
                                    const catLabel = localizeName(cat);
                                    return hasSubs ? (
                                      <MobileNavSplitRow
                                        key={cat.id}
                                        href={catalogCategoryUrl(cat)}
                                        label={catLabel}
                                        headingClassName={
                                          mobileNavCatalogHeadingClass
                                        }
                                        expandLabel={t(
                                          "header.expandSubitems",
                                        ).replace("{name}", catLabel)}
                                        collapseLabel={t(
                                          "header.collapseSubitems",
                                        ).replace("{name}", catLabel)}
                                        onNavigate={() =>
                                          setMobileNavOpen(false)
                                        }
                                      >
                                        {cat.subcategories.map((sub) => (
                                          <Link
                                            key={sub.id}
                                            href={catalogSubcategoryUrl(
                                              cat,
                                              sub,
                                            )}
                                            onClick={() =>
                                              setMobileNavOpen(false)
                                            }
                                            className={cn(
                                              "block rounded-lg px-3 py-2 transition hover:bg-muted",
                                              mobileNavCatalogRowClass,
                                            )}
                                          >
                                            {localizeName(sub)}
                                          </Link>
                                        ))}
                                      </MobileNavSplitRow>
                                    ) : (
                                      <Link
                                        key={cat.id}
                                        href={catalogCategoryUrl(cat)}
                                        onClick={() => setMobileNavOpen(false)}
                                        className={cn(
                                          "rounded-lg px-3 py-2 transition hover:bg-muted",
                                          mobileNavCatalogHeadingClass,
                                        )}
                                      >
                                        {catLabel}
                                      </Link>
                                    );
                                  },
                                )
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
                              <Briefcase
                                className={cn(
                                  mobileNavRootIconClass,
                                  "text-foreground/70",
                                )}
                                strokeWidth={2}
                                aria-hidden
                              />
                              <span
                                className={cn(
                                  "min-w-0 flex-1 truncate",
                                  navPrimaryLabelClass,
                                )}
                              >
                                {t("header.nav.services")}
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
                                    href={catalogServiceUrl(service)}
                                    onClick={() => setMobileNavOpen(false)}
                                    className={cn(
                                      "rounded-lg px-3 py-2 transition hover:bg-muted",
                                      mobileNavCatalogHeadingClass,
                                    )}
                                  >
                                    {localizeName(service)}
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
