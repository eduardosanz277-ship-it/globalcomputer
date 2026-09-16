import type { Locale } from "@/components/i18n/translations";
import { formatServerErrorMessage } from "@/lib/errors/format-server-error";

export type ServerActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; message: string };

export async function runServerAction<T>(
  locale: Locale,
  fallbackKey: string,
  fn: () => Promise<T>,
): Promise<ServerActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (e: unknown) {
    return {
      ok: false,
      message: formatServerErrorMessage(e, locale, fallbackKey),
    };
  }
}
