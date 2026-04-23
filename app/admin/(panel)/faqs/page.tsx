import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getAllFaqsAdminService } from "@/modules/admin/faqs/faqs.service";
import { isGlobalAdmin } from "@/modules/auth/auth.guards";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { redirect } from "next/navigation";
import { AdminFaqsTable } from "./AdminFaqsTable";
import { FaqsPageHeader } from "./FaqsPageHeader";

async function AdminFaqsTableSection() {
  const items = await getAllFaqsAdminService();
  return <AdminFaqsTable faqs={items} />;
}

export default async function AdminFaqsPage() {
  const current = await getCurrentUserService();
  if (!isGlobalAdmin(current?.role)) {
    redirect("/admin");
  }

  return (
    <Card className="w-full">
      <CardContent>
        <FaqsPageHeader />

        <hr className="border-border" />

        <Suspense fallback={<AdminFaqsTable faqs={[]} isLoading />}>
          <AdminFaqsTableSection />
        </Suspense>
      </CardContent>
    </Card>
  );
}
