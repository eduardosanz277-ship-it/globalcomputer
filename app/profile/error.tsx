"use client";

import { useEffect } from "react";
import { ConnectionErrorState } from "@/components/errors/ConnectionErrorState";
import { useBoundaryRetry } from "@/components/errors/use-boundary-retry";
import { resolveBoundaryError } from "@/lib/errors/resolve-boundary-error";

export default function ProfileError({
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
    <div className="flex min-h-[50vh] items-center justify-center px-4 py-10">
      <ConnectionErrorState isNetworkError={isNetworkError} onRetry={retry} />
    </div>
  );
}
