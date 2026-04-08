import { NextResponse } from "next/server";
import { logoutService } from "@/modules/auth/auth.service";

/**
 * Redirige al home del mismo origen que la petición (evita mandar a localhost
 * en staging si `NEXT_PUBLIC_APP_URL` no está definido).
 */
export async function POST(request: Request) {
  await logoutService();
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(new URL("/", origin));
}

