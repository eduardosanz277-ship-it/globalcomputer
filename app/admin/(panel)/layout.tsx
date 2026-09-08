import { redirect } from "next/navigation";
import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import { canAccessAdminRoutes } from "@/modules/auth/auth.guards";
import { AdminShell } from "@/components/admin/AdminShell";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { repoCountPendingBusinessProfiles } from "@/modules/admin/business-profiles/business-profiles.repository";

async function getConflictOrdersCount(): Promise<number> {
  try {
    const supabase = await createSupabaseServerClient();
    const { count } = await supabase
      .from("store_orders")
      .select("id", { head: true, count: "exact" })
      .eq("inventory_status", "conflict");
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function getPendingBusinessSubscriptionsCount(): Promise<number> {
  return repoCountPendingBusinessProfiles();
}

function buildNavBadges(
  conflictOrdersCount: number,
  pendingSubscriptionsCount: number,
): Record<string, number> | undefined {
  const badges: Record<string, number> = {};
  if (conflictOrdersCount > 0) {
    badges["/admin/orders"] = conflictOrdersCount;
  }
  if (pendingSubscriptionsCount > 0) {
    badges["/admin/suscripciones-empresas"] = pendingSubscriptionsCount;
  }
  return Object.keys(badges).length > 0 ? badges : undefined;
}

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, conflictOrdersCount, pendingSubscriptionsCount] =
    await Promise.all([
      getCurrentUserStrictService(),
      getConflictOrdersCount(),
      getPendingBusinessSubscriptionsCount(),
    ]);

  if (!user) {
    redirect("/admin/login");
  }

  if (!canAccessAdminRoutes(user.role)) {
    redirect("/");
  }

  return (
    <AdminShell
      user={{
        fullName: user.fullName ?? user.email ?? "Admin",
        email: user.email,
        role: user.role,
      }}
      navBadges={buildNavBadges(
        conflictOrdersCount,
        pendingSubscriptionsCount,
      )}
    >
      {children}
    </AdminShell>
  );
}
