import { NextRequest, NextResponse } from "next/server";

import { repoGetOtpCooldown } from "@/modules/auth/auth.repository";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase() ?? "";
  if (!email) {
    return NextResponse.json(
      { error: "El correo es obligatorio" },
      { status: 400 },
    );
  }

  const blockedUntil = await repoGetOtpCooldown(email);
  return NextResponse.json({
    email,
    blockedUntil: blockedUntil ? blockedUntil.toISOString() : null,
  });
}
