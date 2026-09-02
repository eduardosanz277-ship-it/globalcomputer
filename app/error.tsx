"use client";

import { useEffect } from "react";
import { ConnectionErrorState } from "@/components/errors/ConnectionErrorState";
import { useBoundaryRetry } from "@/components/errors/use-boundary-retry";
import { resolveBoundaryError } from "@/lib/errors/resolve-boundary-error";

/** Errores de páginas públicas (tienda, servicios, contacto, etc.). Admin y profile tienen su propio error.tsx. */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const { isNetworkError } = resolveBoundaryError(error);
  const retry = useBoundaryRetry(reset);

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-gradient-to-b from-muted/30 to-background px-4 py-10">
      <ConnectionErrorState isNetworkError={isNetworkError} onRetry={retry} />
    </div>
  );
}
