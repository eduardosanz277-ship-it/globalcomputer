"use client";

import { isNetworkActionError } from "@/lib/errors/network-action-error";
import { useCallback, useState } from "react";

function createNetworkError(): TypeError {
  return new TypeError("Failed to fetch");
}

/** Estado de carga para reservas/actualizaciones del carrito (cantidad, eliminar). */
export function useRunCartMutation() {
  const [mutationPending, setMutationPending] = useState(false);

  const runCartMutation = useCallback(async (fn: () => Promise<void>) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      throw createNetworkError();
    }

    setMutationPending(true);
    try {
      await fn();
    } catch (error) {
      if (isNetworkActionError(error)) throw createNetworkError();
      throw error;
    } finally {
      setMutationPending(false);
    }
  }, []);

  return { mutationPending, runCartMutation };
}
