"use client";

import {
  appLoadingDone,
  appLoadingStart,
  subscribeAppLoading,
} from "@/lib/app-loading";
import { cn } from "@/utils/cn";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const NAV_TIMEOUT_MS = 20_000;

function isModifiedClick(event: MouseEvent) {
  return (
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
}

function resolveSameOriginUrl(href: string): URL | null {
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return null;
    return url;
  } catch {
    return null;
  }
}

/**
 * Barra superior solo para navegación entre páginas.
 * Formularios/API con loading en el botón no la disparan (evita feedback duplicado).
 */
export function AppLoadingListener() {
  const pathname = usePathname();
  const navPendingRef = useRef(false);
  const navTimeoutRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);
  const trickleRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);

  const clearNavTimeout = () => {
    if (navTimeoutRef.current != null) {
      window.clearTimeout(navTimeoutRef.current);
      navTimeoutRef.current = null;
    }
  };

  const beginNavigation = () => {
    if (navPendingRef.current) return;
    navPendingRef.current = true;
    appLoadingStart();
    clearNavTimeout();
    navTimeoutRef.current = window.setTimeout(() => {
      if (!navPendingRef.current) return;
      navPendingRef.current = false;
      appLoadingDone();
    }, NAV_TIMEOUT_MS);
  };

  const endNavigation = () => {
    if (!navPendingRef.current) return;
    navPendingRef.current = false;
    clearNavTimeout();
    appLoadingDone();
  };

  useEffect(() => {
    endNavigation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (isModifiedClick(event)) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        return;
      }

      const url = resolveSameOriginUrl(href);
      if (!url) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }

      beginNavigation();
    };

    const onPopState = () => beginNavigation();

    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("click", onDocumentClick, true);
      window.removeEventListener("popstate", onPopState);
      clearNavTimeout();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const clearTrickle = () => {
      if (trickleRef.current != null) {
        window.clearInterval(trickleRef.current);
        trickleRef.current = null;
      }
    };
    const clearExit = () => {
      if (exitTimerRef.current != null) {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };

    return subscribeAppLoading((active) => {
      if (active) {
        clearExit();
        setExiting(false);
        setVisible(true);
        setProgress((current) => (current < 12 ? 12 : current));
        clearTrickle();
        trickleRef.current = window.setInterval(() => {
          setProgress((current) => {
            if (current >= 92) return current;
            const delta = current < 40 ? 8 : current < 70 ? 4 : 1.5;
            return Math.min(92, current + delta);
          });
        }, 320);
        return;
      }

      clearTrickle();
      setProgress(100);
      setExiting(true);
      clearExit();
      exitTimerRef.current = window.setTimeout(() => {
        setVisible(false);
        setExiting(false);
        setProgress(0);
      }, 280);
    });
  }, []);

  if (!visible && !exiting) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[2147483646]"
      aria-hidden
      role="presentation"
    >
      <div
        className={cn(
          "h-[3px] origin-left bg-primary shadow-[0_0_8px_rgba(53,127,210,0.55)] transition-[width,opacity] duration-200 ease-out",
          exiting && "opacity-0",
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
