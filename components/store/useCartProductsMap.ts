"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import type { StorefrontProduct } from "@/modules/catalog/storefront-product.shared";
import { isNetworkActionError } from "@/lib/errors/network-action-error";

const FETCH_TIMEOUT_MS = 12_000;

function createNetworkError(): TypeError {
  return new TypeError("Failed to fetch");
}

function normalizeLoadError(error: unknown, aborted: boolean): unknown {
  if (aborted || isNetworkActionError(error)) return createNetworkError();
  return error ?? createNetworkError();
}

function isBrowserOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

type Options = {
  /** Si es false, no hidrata (p. ej. drawer cerrado). Al volver a true se reinicia el estado. */
  enabled?: boolean;
};

export function useCartProductsMap(
  productIds: string[],
  options: Options = {},
): {
  productsById: Record<string, StorefrontProduct>;
  loading: boolean;
  /** Error al hidratar productos (p. ej. sin red); no confundir con producto dado de baja. */
  loadError: unknown | null;
  retry: () => void;
} {
  const enabled = options.enabled ?? true;
  const key = useMemo(
    () => [...new Set(productIds)].sort().join(","),
    [productIds],
  );

  const [productsById, setProductsById] = useState<
    Record<string, StorefrontProduct>
  >({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<unknown | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  const retry = useCallback(() => {
    setRetryNonce((current) => current + 1);
  }, []);

  /**
   * Antes del paint al abrir el drawer: limpia datos/error obsoletos y comprueba red al instante.
   */
  useLayoutEffect(() => {
    if (!enabled) return;

    if (!key) {
      setProductsById({});
      setLoadError(null);
      setLoading(false);
      return;
    }

    setProductsById({});

    if (isBrowserOffline()) {
      setLoadError(createNetworkError());
      setLoading(false);
      return;
    }

    setLoadError(null);
    setLoading(true);
  }, [enabled, key, retryNonce]);

  useEffect(() => {
    if (!enabled || !key) return;
    if (isBrowserOffline()) return;

    let cancelled = false;
    let aborted = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      aborted = true;
      controller.abort();
    }, FETCH_TIMEOUT_MS);

    const failOffline = () => {
      if (cancelled) return;
      aborted = true;
      controller.abort();
      setProductsById({});
      setLoadError(createNetworkError());
      setLoading(false);
    };

    window.addEventListener("offline", failOffline);

    fetch(`/api/carrito/productos?ids=${encodeURIComponent(key)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as {
          products?: StorefrontProduct[];
          error?: string;
          code?: string;
        } | null;

        if (!response.ok) {
          if (response.status === 503 || payload?.code === "NETWORK") {
            throw createNetworkError();
          }
          throw new Error(
            typeof payload?.error === "string"
              ? payload.error
              : `HTTP ${response.status}`,
          );
        }

        return payload;
      })
      .then((data) => {
        if (cancelled) return;
        const list = data?.products ?? [];
        const next: Record<string, StorefrontProduct> = {};
        for (const product of list) {
          next[product.id] = product;
        }
        setProductsById(next);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setProductsById({});
        setLoadError(normalizeLoadError(error, aborted));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
        window.clearTimeout(timeoutId);
      });

    return () => {
      cancelled = true;
      aborted = true;
      controller.abort();
      window.clearTimeout(timeoutId);
      window.removeEventListener("offline", failOffline);
    };
  }, [enabled, key, retryNonce]);

  return { productsById, loading, loadError, retry };
}
