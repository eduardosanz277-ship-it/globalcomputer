import { getPublicSiteOffer } from "@/lib/site-offer.server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const offer = await getPublicSiteOffer();
  return NextResponse.json(offer, {
    headers: { "Cache-Control": "no-store" },
  });
}
