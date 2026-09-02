"use server";

import type { LoginSchema } from "@/modules/auth/auth.schema";
import { adminPasswordLoginService } from "@/modules/auth/auth.service";
import type { Locale } from "@/components/i18n/translations";

export async function adminLoginAction(
  values: LoginSchema,
  locale?: Locale,
) {
  return adminPasswordLoginService(values, locale);
}
