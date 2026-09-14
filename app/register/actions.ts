"use server";

import { formatServerErrorMessage } from "@/lib/errors/format-server-error";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { recognizedAppLocale } from "@/lib/i18n/parse-locale";
import { registerService } from "@/modules/auth/auth.service";
import { RegisterSchema } from "@/modules/auth/auth.schema";

export type RegisterActionResult =
  | { ok: true }
  | { ok: false; message: string };

/** Devuelve `{ ok: false, message }` en lugar de lanzar (Next.js oculta throws en prod). */
export async function registerAction(
  values: RegisterSchema,
  locale?: string,
): Promise<RegisterActionResult> {
  const resolvedLocale =
    recognizedAppLocale(locale) ?? (await getServerLocale());
  try {
    await registerService(values, resolvedLocale);
    return { ok: true };
  } catch (e: unknown) {
    return {
      ok: false,
      message: formatServerErrorMessage(
        e,
        resolvedLocale,
        "registerBusiness.errors.generic",
      ),
    };
  }
}
