import { NextResponse } from "next/server";
import { logoutService } from "@/modules/auth/auth.service";

export async function POST() {
  await logoutService();
  return NextResponse.redirect(new URL("/auth/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}

