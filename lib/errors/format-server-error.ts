import type { Locale } from "@/components/i18n/translations";
import { translate } from "@/lib/i18n/get-translation";
import {
  extractErrorMessage,
  isNetworkActionError,
} from "@/lib/errors/network-action-error";
import { isTechnicalErrorMessage } from "@/lib/errors/format-client-error";

/** Mensaje traducido para respuestas de server actions / servicios. */
export function formatServerErrorMessage(
  error: unknown,
  locale: Locale,
  fallbackKey = "common.errors.unexpected",
): string {
  if (isNetworkActionError(error)) {
    return translate(locale, "common.errors.network");
  }

  const apiMessage = extractErrorMessage(error);
  if (apiMessage && !isTechnicalErrorMessage(apiMessage)) {
    return apiMessage;
  }

  return translate(locale, fallbackKey);
}
