"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * `reset()` por sí solo vuelve a montar el boundary con la carga RSC ya cacheada, así que
 * repite el mismo error. Refrescar la ruta antes fuerza a pedir de nuevo los datos.
 */
export function useBoundaryRetry(reset: () => void): () => void {
  const router = useRouter();

  return useCallback(() => {
    router.refresh();
    reset();
  }, [router, reset]);
}
