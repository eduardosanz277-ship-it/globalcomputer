"use client";

import { useCallback, useState } from "react";

/** Estado de carga para reservas/actualizaciones del carrito (cantidad, eliminar). */
export function useRunCartMutation() {
  const [mutationPending, setMutationPending] = useState(false);

  const runCartMutation = useCallback(async (fn: () => Promise<void>) => {
    setMutationPending(true);
    try {
      await fn();
    } finally {
      setMutationPending(false);
    }
  }, []);

  return { mutationPending, runCartMutation };
}
