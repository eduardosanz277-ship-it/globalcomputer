"use server";

import { getServerLocale } from "@/lib/i18n/server-locale";
import { recognizedAppLocale } from "@/lib/i18n/parse-locale";
import { formatServerErrorMessage } from "@/lib/errors/format-server-error";
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
  const resolvedLocale =
    recognizedAppLocale(locale) ?? (await getServerLocale());
  try {
    await sendLoginOtpService(email, resolvedLocale);
    return { ok: true };
  } catch (e: unknown) {
    return {
      ok: false,
      message: formatServerErrorMessage(e, resolvedLocale),
    };
  }
}

export type VerifyLoginOtpResult =
  | { ok: true }
  | { ok: false; message: string };

/** Devuelve `{ ok: false, message }` en lugar de lanzar (Next.js oculta throws en prod). */
export async function verifyLoginOtpAction(
  email: string,
  code: string,
  locale?: string,
): Promise<VerifyLoginOtpResult> {
  const resolvedLocale =
    recognizedAppLocale(locale) ?? (await getServerLocale());
  try {
    await verifyLoginOtpService(email, code, resolvedLocale);
    return { ok: true };
  } catch (e: unknown) {
    return {
      ok: false,
      message: formatServerErrorMessage(
        e,
        resolvedLocale,
        "login.errors.default",
      ),
    };
  }
}
