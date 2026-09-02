/** Mensaje legible desde Error, PostgrestError, AuthApiError u otros objetos rechazados. */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.trim();
    if (msg && msg !== "[object Object]") return msg;
    if (error.cause != null) {
      const fromCause = extractErrorMessage(error.cause);
      if (fromCause) return fromCause;
    }
    return msg;
  }
  if (typeof error === "object" && error !== null) {
    const obj = error as {
      message?: unknown;
      details?: unknown;
      error?: unknown;
    };
    if (typeof obj.message === "string" && obj.message.trim()) {
      return obj.message.trim();
    }
    if (typeof obj.details === "string" && obj.details.trim()) {
      return obj.details.trim();
    }
    if (typeof obj.error === "string" && obj.error.trim()) {
      return obj.error.trim();
    }
  }
  if (typeof error === "string") return error.trim();
  return "";
}

function errorText(error: unknown): string {
  const parts: string[] = [];
  const message = extractErrorMessage(error);
  if (message) parts.push(message);
  if (error instanceof Error && error.cause != null) {
    const causeMessage = extractErrorMessage(error.cause);
    if (causeMessage && causeMessage !== message) parts.push(causeMessage);
  }
  return parts.join(" ").toLowerCase();
}

/** Errores de conectividad al invocar server actions o servicios remotos. */
export function isNetworkActionError(error: unknown): boolean {
  const text = errorText(error);
  return (
    text.includes("fetch failed") ||
    text.includes("failed to fetch") ||
    text.includes("networkerror") ||
    text.includes("network request failed") ||
    text.includes("econnrefused") ||
    text.includes("enotfound") ||
    text.includes("etimedout") ||
    text.includes("econnreset") ||
    text.includes("econnaborted") ||
    text.includes("eai_again") ||
    text.includes("getaddrinfo") ||
    text.includes("socket hang up") ||
    text.includes("connection refused") ||
    text.includes("network is unreachable") ||
    text.includes("connection to stripe") ||
    text.includes("unable to connect") ||
    text.includes("err_internet_disconnected") ||
    text.includes("request timed out") ||
    text.includes("import { connect timeout|connect timeout error")
  );
}
