"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { AppLogo } from "@/components/brand/AppLogo";
import { useI18n } from "@/components/i18n/I18nProvider";
import { LanguageSelector } from "@/components/i18n/LanguageSelector";
import { SITE_BRAND_NAME } from "@/lib/site";
import { cn } from "@/utils/cn";
import { ADMIN_NAV_GROUPS } from "./admin-nav-config";

type Props = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Drawer móvil abierto (< md) */
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onStartNavigation?: () => void;
};

function pathMatches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Estado inicial: acordeones abiertos si la ruta actual cae en esa sección. */
function computeOpenSubmenus(pathname: string): Record<string, boolean> {
  const next: Record<string, boolean> = {};
  for (const group of ADMIN_NAV_GROUPS) {
    for (const item of group.items) {
      if (item.children?.length) {
        const activeChild = item.children.some((c) =>
          pathMatches(pathname, c.href),
        );
        const activeParent = pathMatches(pathname, item.href);
        next[item.href] = activeChild || activeParent;
      }
    }
  }
  return next;
}

/** Cierra acordeones cuya sección ya no coincide con la ruta (al navegar fuera). */
function closeSubmenusOutsidePath(
  pathname: string,
  prev: Record<string, boolean>,
): Record<string, boolean> {
  const next = { ...prev };
  for (const group of ADMIN_NAV_GROUPS) {
    for (const item of group.items) {
      if (!item.children?.length) continue;
      const inSection =
        pathMatches(pathname, item.href) ||
        item.children.some((c) => pathMatches(pathname, c.href));
      if (!inSection) {
        next[item.href] = false;
      }
    }
  }
  return next;
}

export function AdminSidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  onStartNavigation,
}: Props) {
  const { t } = useI18n();
  const pathname = usePathname() ?? "";
  /** En escritorio: barra estrecha con iconos; en móvil (drawer) siempre expandida */
  const collapsedNav = collapsed && !mobileOpen;
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>(
    () => computeOpenSubmenus(pathname),
  );

  useEffect(() => {
    setOpenSubmenus((prev) => closeSubmenusOutsidePath(pathname, prev));
  }, [pathname]);

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const nav = useMemo(
    () =>
      ADMIN_NAV_GROUPS.map((group) => ({
        ...group,
        label: t(group.labelKey),
        items: group.items.map((item) => ({
          ...item,
          label: t(item.labelKey),
          children: item.children?.map((sub) => ({
            ...sub,
            label: t(sub.labelKey),
          })),
        })),
      })),
    [t],
  );

  const handleLinkNavigation = (href: string) => {
    const isCurrent = pathMatches(pathname, href);
    onCloseMobile();
    if (!isCurrent) {
      onStartNavigation?.();
    }
  };

  return (
    <aside
      className={cn(
        /** Por debajo de modales / slide-overs (`z-50` en `dialog` / `slide-over`). */
        "fixed inset-y-0 left-0 z-30 flex h-dvh min-h-0 flex-col border-r border-border/80 bg-white",
        "transition-[width,transform] duration-200 ease-out",
        "w-screen md:w-[260px]",
        collapsed ? "md:w-[72px]" : "md:w-[260px]",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )}
    >
      <div
        className={cn(
          "flex min-h-[4rem] shrink-0 items-center gap-2 border-b border-border/60 px-3 py-0",
          collapsedNav
            ? "justify-center px-2 md:justify-center"
            : "justify-between",
        )}
      >
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center",
            collapsedNav && "justify-center",
          )}
        >
          {collapsedNav ? (
            <Link
              href="/admin/home"
              onClick={() => handleLinkNavigation("/admin/home")}
              className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl p-0.5 transition-opacity hover:opacity-90"
              title={SITE_BRAND_NAME}
            >
              <AppLogo variant="mark" className="h-12 w-12" />
            </Link>
          ) : (
            <Link
              href="/admin/home"
              onClick={() => handleLinkNavigation("/admin/home")}
              className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden rounded-xl px-2.5 transition-opacity hover:opacity-90"
            >
              <AppLogo
                variant="mark"
                className="h-9 w-9 shrink-0 md:h-12 md:w-12"
              />
              <span className="min-w-0 shrink truncate font-roboto text-sm font-light leading-tight tracking-tight text-[#040b1f] sm:text-[0.95rem] max-md:whitespace-normal md:truncate">
                {SITE_BRAND_NAME}
              </span>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-1.5 md:hidden">
          <LanguageSelector
            className="shrink-0"
            buttonClassName="h-8 w-8 border-border bg-background text-foreground hover:bg-muted"
            aria-label={t("admin.header.languageToggle")}
          />
          <button
            type="button"
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            onClick={onCloseMobile}
            aria-label={t("admin.menu.closeMenu")}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden py-3"
        aria-label={t("admin.menu.navigationAria")}
      >
        <div className="space-y-3 px-2">
          {nav.map((group, groupIndex) => (
            <section key={group.id}>
              {groupIndex > 0 ? (
                <div
                  className={cn(
                    "-mx-2 mb-3 border-t border-border/70",
                    collapsedNav && "-mx-2",
                  )}
                  aria-hidden
                />
              ) : null}
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const hasChildren = Boolean(item.children?.length);
                  const parentActive =
                    pathMatches(pathname, item.href) ||
                    (hasChildren &&
                      item.children!.some((c) => pathMatches(pathname, c.href)));
                  const submenuOpen = hasChildren
                    ? (openSubmenus[item.href] ?? false)
                    : false;

                  return (
                    <li key={item.href}>
                      {hasChildren && collapsedNav ? (
                        <Link
                          href={item.href}
                          onClick={() => handleLinkNavigation(item.href)}
                          className={cn(
                            "flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                            parentActive && "border-l-[3px] border-l-primary",
                            parentActive
                              ? "bg-admin-muted text-admin"
                              : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                          )}
                          title={item.label}
                        >
                          <Icon className="h-5 w-5 shrink-0" aria-hidden />
                        </Link>
                      ) : hasChildren ? (
                        <>
                          <button
                            type="button"
                            onClick={() => toggleSubmenu(item.href)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                              parentActive && "border-l-[3px] border-l-primary",
                              parentActive
                                ? "bg-admin-muted text-admin"
                                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                            )}
                          >
                            <Icon className="h-5 w-5 shrink-0" aria-hidden />
                            <span className="flex-1 truncate">{item.label}</span>
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 shrink-0 transition-transform",
                                submenuOpen && "rotate-180",
                              )}
                            />
                          </button>
                          {!collapsedNav && submenuOpen && (
                            <ul className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-border/80 pl-3">
                              {item.children!.map((sub) => {
                                const subActive = pathMatches(pathname, sub.href);
                                return (
                                  <li key={sub.href}>
                                    <Link
                                      href={sub.href}
                                      onClick={() => handleLinkNavigation(sub.href)}
                                      className={cn(
                                        "block rounded-md px-2 py-1.5 text-sm transition-colors",
                                        subActive && "border-l-[3px] border-l-primary",
                                        subActive
                                          ? "bg-admin-muted font-medium text-admin"
                                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                                      )}
                                    >
                                      {sub.label}
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={() => handleLinkNavigation(item.href)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                            pathMatches(pathname, item.href) &&
                              "border-l-[3px] border-l-primary",
                            pathMatches(pathname, item.href)
                              ? "bg-admin-muted text-admin"
                              : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                            collapsedNav && "justify-center px-0",
                          )}
                          title={collapsedNav ? item.label : undefined}
                        >
                          <Icon className="h-5 w-5 shrink-0" aria-hidden />
                          {!collapsedNav && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </nav>

      <button
        type="button"
        onClick={onToggleCollapsed}
        className="absolute -right-3 top-[5.25rem] z-10 hidden h-7 w-7 items-center justify-center rounded-full border border-border bg-white text-muted-foreground shadow-sm transition hover:bg-muted md:flex"
        aria-label={
          collapsed ? t("admin.menu.expandMenu") : t("admin.menu.collapseMenu")
        }
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </aside>
  );
}
