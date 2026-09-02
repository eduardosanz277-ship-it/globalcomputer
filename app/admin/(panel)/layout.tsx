import { redirect } from "next/navigation";
import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import { canAccessAdminRoutes } from "@/modules/auth/auth.guards";
import { AdminShell } from "@/components/admin/AdminShell";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

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

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, conflictOrdersCount] = await Promise.all([
    getCurrentUserStrictService(),
    getConflictOrdersCount(),
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
      navBadges={conflictOrdersCount > 0 ? { "/admin/orders": conflictOrdersCount } : undefined}
    >
      {children}
    </AdminShell>
  );
}
