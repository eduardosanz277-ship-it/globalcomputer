"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader, type AdminHeaderUser } from "./AdminHeader";
import { NavBadgesProvider } from "./AdminNavBadgesContext";
import { AdminOfflineBanner } from "./AdminOfflineBanner";
import { ConnectionErrorState } from "@/components/errors/ConnectionErrorState";
import { useI18n } from "@/components/i18n/I18nProvider";
import { appNavigationCancel } from "@/lib/app-loading";
import { cn } from "@/utils/cn";

/** Margen antes de dar por fallida una navegación que no llega a resolverse. */
const NAVIGATION_TIMEOUT_MS = 8000;

type Props = {
  user: AdminHeaderUser;
  children: React.ReactNode;
  /** Badge counts indexados por href (e.g. { "/admin/orders": 2 }). */
  navBadges?: Record<string, number>;
};

export function AdminShell({ user, children, navBadges }: Props) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [panelLoading, setPanelLoading] = useState(false);
  const [navigationFailed, setNavigationFailed] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    setPanelLoading(false);
    setNavigationFailed(false);
  }, [pathname]);

  /**
   * Sin red la petición RSC nunca resuelve y la ruta no cambia, así que el spinner se
   * quedaría indefinidamente: lo cortamos al perder conexión o al agotar el margen.
   */
  useEffect(() => {
    if (!panelLoading) return;

    const fail = () => {
      setPanelLoading(false);
      setNavigationFailed(true);
      appNavigationCancel();
    };
    const timeoutId = window.setTimeout(fail, NAVIGATION_TIMEOUT_MS);
    window.addEventListener("offline", fail);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("offline", fail);
    };
  }, [panelLoading]);

  const handleStartNavigation = useCallback(() => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setNavigationFailed(true);
      appNavigationCancel();
      return;
    }
    setNavigationFailed(false);
    setPanelLoading(true);
  }, []);

  const retryNavigation = useCallback(() => {
    setNavigationFailed(false);
    router.refresh();
  }, [router]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    document.body.classList.add("admin-panel-theme");
    return () => {
      document.body.classList.remove("admin-panel-theme");
    };
  }, []);

  return (
    <NavBadgesProvider initialBadges={navBadges}>
    <div className="relative h-dvh min-h-0 overflow-x-hidden overflow-y-hidden bg-background">
      {mobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          aria-label={t("admin.menu.closeMenu")}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onStartNavigation={handleStartNavigation}
      />

      <div
        className={cn(
          "flex h-dvh min-h-0 w-full min-w-0 flex-col overflow-hidden",
          "transition-[padding] duration-200 ease-out",
          collapsed ? "md:pl-[72px]" : "md:pl-[260px]",
        )}
      >
        <AdminHeader
          user={user}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          useStoreLanguageSwitch
        />
        <AdminOfflineBanner />
        <main className="admin-panel relative min-h-0 w-full min-w-0 flex-1 overflow-hidden">
          <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4">
            {navigationFailed ? (
              <ConnectionErrorState onRetry={retryNavigation} />
            ) : (
              <div
                className={cn(
                  "transition-[filter,opacity] duration-200 ease-out",
                  panelLoading &&
                    "pointer-events-none select-none blur-[2px] opacity-75",
                )}
                aria-hidden={panelLoading}
              >
                {children}
              </div>
            )}
          </div>

          <div
            className={cn(
              "pointer-events-none absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-200 ease-out",
              panelLoading ? "opacity-100" : "opacity-0",
            )}
            aria-hidden={!panelLoading}
            aria-busy={panelLoading}
          >
            <div className="rounded-2xl border border-white/60 bg-white/70 px-5 py-4 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
                <span className="text-sm font-medium text-foreground">
                  {locale === "en" ? "Loading..." : "Cargando..."}
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
    </NavBadgesProvider>
  );
}
