"use server";

import { getServerLocale } from "@/lib/i18n/server-locale";
import { recognizedAppLocale } from "@/lib/i18n/parse-locale";
import {
  sendLoginOtpService,
  verifyLoginOtpService,
} from "@/modules/auth/auth.service";

export type SendLoginOtpResult =
  | { ok: true }
  | { ok: false; message: string };

/** Devuelve `{ ok: false, message }` en lugar de lanzar, para no responder 500 en errores esperados (p. ej. límite de envío de email). */
export async function sendLoginOtpAction(
  email: string,
  locale?: string,
): Promise<SendLoginOtpResult> {
  try {
    const resolvedLocale =
      recognizedAppLocale(locale) ?? (await getServerLocale());
    await sendLoginOtpService(email, resolvedLocale);
    return { ok: true };
  } catch (e: unknown) {
    const message =
      e instanceof Error && e.message.trim()
        ? e.message
        : "No se pudo enviar el código";
    return { ok: false, message };
  }
}

export async function verifyLoginOtpAction(email: string, code: string) {
  await verifyLoginOtpService(email, code);
}
