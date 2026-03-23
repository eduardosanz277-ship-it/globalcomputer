import { redirect } from "next/navigation";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { canAccessAdminRoutes } from "@/modules/auth/auth.guards";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserService();

  if (!user) {
    redirect("/auth/login");
  }

  if (!canAccessAdminRoutes(user.role)) {
    redirect("/dashboard");
  }

  return (
    <AdminShell
      user={{
        fullName: user.fullName ?? user.email ?? "Admin",
        email: user.email,
        role: user.role,
      }}
    >
      {children}
    </AdminShell>
  );
}
