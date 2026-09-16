import {
  extractErrorMessage,
  isNetworkActionError,
} from "@/lib/errors/network-action-error";

export type ClientErrorTranslate = (key: string) => string;

/** Mensaje genérico que Next.js devuelve en prod cuando una Server Action/RSC lanza en el servidor. */
export function isNextJsSanitizedErrorMessage(message: string): boolean {
  const trimmed = message.trim().toLowerCase();
  if (!trimmed) return false;
  return (
    trimmed.includes("an error occurred in the server components render") ||
    trimmed.includes("omitted in production builds to avoid leaking sensitive details") ||
    trimmed.includes("digest property is included on this error instance")
  );
}

/** Mensajes técnicos que no deben mostrarse al usuario. */
export function isTechnicalErrorMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return false;
  if (trimmed === "[object Object]") return true;
  if (isNextJsSanitizedErrorMessage(trimmed)) return true;
  return isNetworkActionError(new Error(trimmed));
}

/**
 * Mensaje listo para toast/UI en el cliente.
 * Prioridad: red → mensaje de negocio legible → errorMessage del flujo → genérico i18n.
 */
export function formatClientError(
  error: unknown,
  t: ClientErrorTranslate,
  options?: {
    errorMessage?: string;
  },
): string {
  if (isNetworkActionError(error)) {
    return t("common.errors.network");
  }

  const apiMessage = extractErrorMessage(error);
  if (apiMessage && !isTechnicalErrorMessage(apiMessage)) {
    return apiMessage;
  }

  if (options?.errorMessage?.trim()) {
    return options.errorMessage.trim();
  }

  return t("common.errors.unexpected");
}
