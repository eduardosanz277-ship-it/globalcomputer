import { isTaggedNetworkError } from "@/lib/errors/rsc-network-error";
import { isNetworkActionError } from "@/lib/errors/network-action-error";

/**
 * Next.js oculta el mensaje real en producción; usamos digest, el texto del error
 * y el estado offline del navegador.
 */
export function resolveBoundaryError(error: unknown): {
  isNetworkError: boolean;
} {
  const isBrowserOffline =
    typeof navigator !== "undefined" && navigator.onLine === false;

  return {
    isNetworkError:
      isTaggedNetworkError(error) ||
      isNetworkActionError(error) ||
      isBrowserOffline,
  };
}
