"use client";

import { ConnectionErrorState } from "@/components/errors/ConnectionErrorState";
import { useClientNavigationFailure } from "@/hooks/use-client-navigation-failure";
import { APP_NAVIGATION_START_EVENT } from "@/lib/app-loading";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

function isPublicMarketingRoute(pathname: string): boolean {
  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/profile")) return false;
  return true;
}

/**
 * En rutas públicas, detecta navegación cliente que no resuelve por falta de red.
 */
export function PublicNavigationGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const { failed, startNavigation, retry } =
    useClientNavigationFailure(pathname);

  useEffect(() => {
    if (!isPublicMarketingRoute(pathname)) return;

    const onNavStart = () => {
      startNavigation();
    };

    window.addEventListener(APP_NAVIGATION_START_EVENT, onNavStart);
    return () =>
      window.removeEventListener(APP_NAVIGATION_START_EVENT, onNavStart);
  }, [pathname, startNavigation]);

  if (!isPublicMarketingRoute(pathname)) {
    return children;
  }

  if (failed) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 py-10">
        <ConnectionErrorState onRetry={retry} />
      </div>
    );
  }

  return children;
}
