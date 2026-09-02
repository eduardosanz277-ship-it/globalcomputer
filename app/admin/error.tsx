"use client";

import { useEffect } from "react";
import { ConnectionErrorState } from "@/components/errors/ConnectionErrorState";
import { useBoundaryRetry } from "@/components/errors/use-boundary-retry";
import { resolveBoundaryError } from "@/lib/errors/resolve-boundary-error";

/** Cubre también los fallos del layout de `(panel)`, que su propio error.tsx no captura. */
export default function AdminError({
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
    <main className="flex min-h-[70vh] items-center justify-center bg-gradient-to-b from-muted/30 to-background">
      <ConnectionErrorState isNetworkError={isNetworkError} onRetry={retry} />
    </main>
  );
}
