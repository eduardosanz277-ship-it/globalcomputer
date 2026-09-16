"use server";

import type { LoginSchema } from "@/modules/auth/auth.schema";
import { adminPasswordLoginService } from "@/modules/auth/auth.service";
import type { Locale } from "@/components/i18n/translations";
import { formatServerErrorMessage } from "@/lib/errors/format-server-error";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { recognizedAppLocale } from "@/lib/i18n/parse-locale";

export type AdminLoginActionResult =
  | { ok: true }
  | { ok: false; message: string };

/** Devuelve `{ ok: false, message }` en lugar de lanzar (Next.js oculta throws en prod). */
export async function adminLoginAction(
  values: LoginSchema,
  locale?: Locale,
): Promise<AdminLoginActionResult> {
  const resolvedLocale =
    (recognizedAppLocale(locale) ?? (await getServerLocale())) as Locale;
  try {
    await adminPasswordLoginService(values, resolvedLocale);
    return { ok: true };
  } catch (e: unknown) {
    return {
      ok: false,
      message: formatServerErrorMessage(
        e,
        resolvedLocale,
        "adminLogin.errors.generic",
      ),
    };
  }
}
