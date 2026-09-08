import { NextResponse } from "next/server";
import { ensureAdminUserService } from "@/modules/auth/auth.service";
import { repoCountPendingBusinessProfiles } from "@/modules/admin/business-profiles/business-profiles.repository";

export async function GET() {
  try {
    await ensureAdminUserService();
    const count = await repoCountPendingBusinessProfiles();
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
