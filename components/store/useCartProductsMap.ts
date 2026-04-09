"use client";

import { useEffect, useMemo, useState } from "react";
import type { StorefrontProduct } from "@/modules/catalog/storefront-product.shared";

export function useCartProductsMap(productIds: string[]): {
  productsById: Record<string, StorefrontProduct>;
  loading: boolean;
} {
  const key = useMemo(() => [...new Set(productIds)].sort().join(","), [productIds]);

  const [productsById, setProductsById] = useState<
    Record<string, StorefrontProduct>
  >({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!key) {
      setProductsById({});
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const q = encodeURIComponent(key.split(",").join(","));
    fetch(`/api/carrito/productos?ids=${q}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { products?: StorefrontProduct[] }) => {
        if (cancelled) return;
        const list = data.products ?? [];
        const next: Record<string, StorefrontProduct> = {};
        for (const p of list) {
          next[p.id] = p;
        }
        setProductsById(next);
      })
      .catch(() => {
        if (!cancelled) setProductsById({});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return { productsById, loading };
}
