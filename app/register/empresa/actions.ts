"use server";

import type { RegisterBusinessFormInput } from "@/modules/auth/auth.schema";
import { formatServerErrorMessage } from "@/lib/errors/format-server-error";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { recognizedAppLocale } from "@/lib/i18n/parse-locale";
import { registerBusinessService } from "@/modules/auth/auth.service";

export type RegisterBusinessActionResult =
  | { ok: true }
  | { ok: false; message: string };

/** Devuelve `{ ok: false, message }` en lugar de lanzar (Next.js oculta throws en prod). */
export async function registerBusinessAction(
  values: RegisterBusinessFormInput,
  locale?: string,
): Promise<RegisterBusinessActionResult> {
  const resolvedLocale =
    recognizedAppLocale(locale) ?? (await getServerLocale());
  try {
    await registerBusinessService(values, resolvedLocale);
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
