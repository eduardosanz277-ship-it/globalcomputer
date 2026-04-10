"use client";

import { useCallback, useEffect, useState } from "react";
import {
  gcCartRead,
  type GcCartItem,
} from "@/lib/store-cart";

export function useGcCart(): GcCartItem[] {
  const [items, setItems] = useState<GcCartItem[]>([]);

  const sync = useCallback(() => {
    setItems(gcCartRead());
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener("gc-cart-changed", sync);
    return () => window.removeEventListener("gc-cart-changed", sync);
  }, [sync]);

  return items;
}
