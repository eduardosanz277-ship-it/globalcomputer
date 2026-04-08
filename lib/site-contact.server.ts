import "server-only";

import { cache } from "react";
import { repoGetAppConfigByKeys } from "@/modules/admin/app-config/app-config.repository";
import {
  type PublicSiteContact,
  SITE_CONTACT_ADDRESS,
  SITE_CONTACT_EMAIL,
  SITE_CONTACT_PHONE_DISPLAY,
  SITE_CONTACT_PHONE_TEL,
} from "@/lib/site";

function normalizePhoneTel(value: string): string {
  const digits = value.replace(/\D+/g, "");
  if (!digits) return SITE_CONTACT_PHONE_TEL;
  if (digits.length === 10) return `+1${digits}`;
  return `+${digits}`;
}

export const getPublicSiteContact = cache(async (): Promise<PublicSiteContact> => {
  try {
    const rows = await repoGetAppConfigByKeys(["support_phone", "support_email"]);
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    const phoneDisplay =
      typeof map.support_phone === "string" && map.support_phone.trim().length > 0
        ? map.support_phone.trim()
        : SITE_CONTACT_PHONE_DISPLAY;

    const email =
      typeof map.support_email === "string" && map.support_email.trim().length > 0
        ? map.support_email.trim()
        : SITE_CONTACT_EMAIL;

    return {
      address: SITE_CONTACT_ADDRESS,
      email,
      phoneDisplay,
      phoneTel: normalizePhoneTel(phoneDisplay),
    };
  } catch {
    return {
      address: SITE_CONTACT_ADDRESS,
      email: SITE_CONTACT_EMAIL,
      phoneDisplay: SITE_CONTACT_PHONE_DISPLAY,
      phoneTel: SITE_CONTACT_PHONE_TEL,
    };
  }
});
