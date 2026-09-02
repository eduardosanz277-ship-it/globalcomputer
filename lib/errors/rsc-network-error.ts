import {
  extractErrorMessage,
  isNetworkActionError,
} from "@/lib/errors/network-action-error";

/**
 * Next.js sólo envía `message` al error boundary en desarrollo, pero siempre conserva
 * `digest`. Marcamos ahí los fallos de conexión para poder distinguirlos en producción.
 */
export const NETWORK_ERROR_DIGEST = "GC_NETWORK_ERROR";

type DigestError = Error & { digest?: string };

/** Etiqueta el error como de red (conservando el original en `cause`) si lo es. */
export function tagNetworkError(error: unknown): unknown {
  if (!isNetworkActionError(error)) return error;

  const tagged: DigestError =
    error instanceof Error ? error : new Error("fetch failed", { cause: error });
  tagged.digest = NETWORK_ERROR_DIGEST;
  return tagged;
}

/** Relanza el error marcándolo cuando se debe a falta de conexión. */
export function rethrowTaggingNetworkError(error: unknown): never {
  throw tagNetworkError(error);
}

/** Relanza un error remoto (Supabase, fetch…) etiquetándolo si es de red. */
export function throwRemoteError(error: unknown): never {
  rethrowTaggingNetworkError(error);
  if (error instanceof Error) throw error;
  const message = extractErrorMessage(error);
  throw new Error(message || "Unexpected error", { cause: error });
}

/** Para respuestas Supabase: `if (error) assertRemoteOk(error)`. */
export function assertRemoteOk(error: unknown): void {
  if (error) throwRemoteError(error);
}

/**
 * Lanza error etiquetado si es de red; en otros casos no hace nada.
 * Útil antes de `return null` / `notFound()` para no confundir fallo de red con 404.
 */
export function failOnNetworkError(error: unknown): void {
  if (error && isNetworkActionError(error)) {
    throwRemoteError(error);
  }
}

/** `true` si el error viaja marcado como de red o su mensaje lo delata. */
export function isTaggedNetworkError(error: unknown): boolean {
  if (
    typeof error === "object" &&
    error !== null &&
    (error as DigestError).digest === NETWORK_ERROR_DIGEST
  ) {
    return true;
  }
  return isNetworkActionError(error);
}
