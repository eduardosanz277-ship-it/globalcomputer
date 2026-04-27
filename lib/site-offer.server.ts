import "server-only";

import { cache } from "react";
import type { PublicSiteOffer } from "@/lib/site-offer.types";
import { repoGetAppConfigByKeys } from "@/modules/admin/app-config/app-config.repository";

export const getPublicSiteOffer = cache(async (): Promise<PublicSiteOffer> => {
  try {
    const rows = await repoGetAppConfigByKeys(["offer_amount", "offer_percentage"]);
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    const rawAmount = map.offer_amount;
    const offerAmount =
      typeof rawAmount === "number"
        ? rawAmount
        : typeof rawAmount === "string"
          ? parseFloat(rawAmount)
          : Number(rawAmount);

    const rawPercentage = map.offer_percentage;
    const offerPercentage =
      typeof rawPercentage === "number"
        ? rawPercentage
        : typeof rawPercentage === "string"
          ? parseFloat(rawPercentage)
          : Number(rawPercentage);

    return {
      offerAmount: Number.isFinite(offerAmount) ? offerAmount : 0,
      offerPercentage: Number.isFinite(offerPercentage) ? offerPercentage : 0,
    };
  } catch {
    return {
      offerAmount: 0,
      offerPercentage: 0,
    };
  }
});
