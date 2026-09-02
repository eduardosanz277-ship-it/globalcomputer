import {
  extractErrorMessage,
  isNetworkActionError,
} from "@/lib/errors/network-action-error";

export type ClientErrorTranslate = (key: string) => string;

/** Mensajes técnicos que no deben mostrarse al usuario. */
export function isTechnicalErrorMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return false;
  if (trimmed === "[object Object]") return true;
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
