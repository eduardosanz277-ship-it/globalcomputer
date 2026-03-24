import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import {
  getCurrentUserService,
  logoutService,
  syncProfileAfterLoginService,
} from "@/modules/auth/auth.service";

function safeNextPath(raw: string | null): string {
  if (!raw) return "/";
  try {
    const decoded = decodeURIComponent(raw);
    if (!decoded.startsWith("/") || decoded.startsWith("//")) return "/";
    if (decoded.includes("://")) return "/";
    return decoded;
  } catch {
    return "/";
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextPath = safeNextPath(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("auth/callback exchangeCodeForSession:", error.message);
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const user = await getCurrentUserService();
  if (user?.role === "ADMIN") {
    await logoutService();
    return NextResponse.redirect(`${origin}/login?error=admin`);
  }

  await syncProfileAfterLoginService();

  return NextResponse.redirect(`${origin}${nextPath}`);
}
