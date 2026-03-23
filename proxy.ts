import type { NextRequest } from "next/server";
import { updateSession } from "./supabase/middleware";

/** Next.js 16+: sustituye la convención `middleware.ts` (renombrada a proxy). */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}
