"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  ChevronDown,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { AppLogo } from "@/components/brand/AppLogo";
import { AdminNotificationsBell } from "@/components/admin/AdminNotificationsBell";
import { LanguageSelector } from "@/components/i18n/LanguageSelector";
import { useI18n } from "@/components/i18n/I18nProvider";
import { useDropdownPresence } from "@/components/marketing/useDropdownPresence";
import { StoreCartDrawer } from "@/components/store/StoreCartDrawer";
import { useGcCart } from "@/components/store/useGcCart";
import { Button } from "@/components/ui/button";
import { SITE_BRAND_NAME } from "@/lib/site";
import { GC_CART_OPEN_EVENT, gcCartTotalUnits } from "@/lib/store-cart";
import { resolveStorefrontPriceTier } from "@/lib/storefront-pricing";
import type { UserRole } from "@/modules/auth/auth.types";
import { cn } from "@/utils/cn";

export type AdminHeaderUser = {
  fullName: string;
  email: string;
  role: UserRole;
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
  /** Icono + drawer de carrito (pago / cotización), p. ej. en `/profile`. */
  showCart?: boolean;
};

export function AdminHeader({
  user,
  onOpenMobileMenu,
  variant = "admin",
  brandHref: brandHrefProp,
  hideBell = false,
  showCart = false,
}: Props) {
  const brandHref =
    brandHrefProp ?? (variant === "standalone" ? "/" : "/admin/home");
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const userMenuPresence = useDropdownPresence(open);
  const ref = useRef<HTMLDivElement>(null);
  const cartItems = useGcCart();
  const cartCount = gcCartTotalUnits(cartItems);
  const cartBadgeText = cartCount > 99 ? "99+" : String(cartCount);
  const storefrontPriceTier = resolveStorefrontPriceTier(user.role);

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

  useEffect(() => {
    if (!showCart) return;
    const openCartFromAdd = () => setCartOpen(true);
    window.addEventListener(GC_CART_OPEN_EVENT, openCartFromAdd);
    return () => window.removeEventListener(GC_CART_OPEN_EVENT, openCartFromAdd);
  }, [showCart]);

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
        {!hideBell ? <AdminNotificationsBell /> : null}

        {showCart ? (
          <Button
            type="button"
            variant="ghost"
            className="shrink-0 gap-2 rounded-xl px-2.5 hover:bg-transparent hover:text-foreground md:px-3"
            aria-label={`${t("header.nav.cart")} (${cartCount} ${cartCount === 1 ? t("header.itemOne") : t("header.itemMany")})`}
            onClick={() => setCartOpen(true)}
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
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("a, button")) {
                    setOpen(false);
                  }
                }}
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

      {showCart ? (
        <StoreCartDrawer
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          tier={storefrontPriceTier}
        />
      ) : null}
    </header>
  );
}
