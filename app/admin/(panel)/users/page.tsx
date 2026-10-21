import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  parseAdminTableQuery,
  readAdminTableParam,
  type AdminTableSearchParams,
} from "@/lib/admin/server-table";
import { getUsersPageService } from "@/modules/admin/users/users.service";
import { isGlobalAdmin } from "@/modules/auth/auth.guards";
import { getCurrentUserStrictService } from "@/modules/auth/auth.service";
import { redirect } from "next/navigation";
import { AdminUsersTable } from "./AdminUsersTable";
import { UsersPageHeader } from "./UsersPageHeader";

/** Columnas ordenables de la tabla (ids de `AdminUsersTable`). */
const USERS_SORT_IDS = ["user", "lastSignInAt"] as const;

type Props = {
  searchParams?: Promise<AdminTableSearchParams>;
};

async function AdminUsersTableSection({
  searchParams,
}: {
  searchParams: AdminTableSearchParams;
}) {
  const roleParam = readAdminTableParam(searchParams, "role");
  const page = await getUsersPageService({
    ...parseAdminTableQuery(searchParams, USERS_SORT_IDS),
    role: roleParam === "CLIENT" || roleParam === "BUSINESS" ? roleParam : null,
  });
  return <AdminUsersTable page={page} />;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const current = await getCurrentUserStrictService();
  if (!isGlobalAdmin(current?.role)) {
    redirect("/admin");
  }
  const resolvedSearchParams = (await searchParams) ?? {};

  return (
    <Card className="w-full">
      <CardContent>
        <UsersPageHeader />

        <hr className="border-border" />

        <Suspense
          fallback={
            <AdminUsersTable page={{ rows: [], rowCount: 0, pageIndex: 0 }} isLoading />
          }
        >
          <AdminUsersTableSection searchParams={resolvedSearchParams} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
