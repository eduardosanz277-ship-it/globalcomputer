"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { appNavigationCancel } from "@/lib/app-loading";

const NAVIGATION_TIMEOUT_MS = 8000;

/**
 * Detecta navegaciones cliente (p. ej. cambio de tab) que no resuelven por falta de red.
 * `navigationKey` debe cambiar cuando la navegación termina (pathname, searchParams, tab…).
 */
export function useClientNavigationFailure(navigationKey: string) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoading(false);
    setFailed(false);
  }, [navigationKey]);

  useEffect(() => {
    if (!loading) return;

    const fail = () => {
      setLoading(false);
      setFailed(true);
      appNavigationCancel();
    };

    const timeoutId = window.setTimeout(fail, NAVIGATION_TIMEOUT_MS);
    window.addEventListener("offline", fail);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("offline", fail);
    };
  }, [loading]);

  /** @returns `false` si la navegación no debe iniciarse (offline). */
  const startNavigation = useCallback((): boolean => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setFailed(true);
      appNavigationCancel();
      return false;
    }
    setFailed(false);
    setLoading(true);
    return true;
  }, []);

  const retry = useCallback(() => {
    setFailed(false);
    router.refresh();
  }, [router]);

  return { loading, failed, startNavigation, retry };
}
